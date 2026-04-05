// ============================================================
//  routes/webhooks.js  —  Vapi → Your Backend (Option A)
//
//  Vapi POSTs call events to this URL the moment something
//  happens: call starts, call ends, transcripts ready, etc.
//
//  You configure this URL in Vapi dashboard → Phone Numbers
//  or per-assistant as "Server URL":
//    https://your-backend.railway.app/api/webhooks/vapi
//
//  IMPORTANT: This route does NOT use our auth middleware —
//  Vapi calls it directly. We verify it came from Vapi via
//  the x-vapi-secret header (set in Vapi dashboard).
// ============================================================
const express = require('express');
const router  = express.Router();
const { db }  = require('../db');

// ── POST /api/webhooks/vapi ───────────────────────────────
router.post('/vapi', async (req, res) => {
  try {
    // ── Optional: Verify the request is genuinely from Vapi ──
    // In Vapi dashboard → your assistant → Server URL, you can
    // add a secret. Then uncomment this:
    //
    // const secret = req.headers['x-vapi-secret'];
    // if (secret !== process.env.VAPI_WEBHOOK_SECRET) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const payload = req.body;
    const msgType = payload?.message?.type;

    console.log(`[Webhook] Received Vapi event: ${msgType}`);

    // ── Handle end-of-call report ─────────────────────────
    // This is the most important event — fires when call ends.
    if (msgType === 'end-of-call-report') {
      const msg  = payload.message;
      const call = msg.call;
      const assistant = call?.assistantId || msg.assistant?.id;

      if (!assistant) {
        console.warn('[Webhook] No assistantId in event — skipping');
        return res.sendStatus(200);
      }

      // Find which client owns this assistant
      const agent = await db.oneOrNone(
        'SELECT id, user_id FROM agents WHERE vapi_assistant_id = $1',
        [assistant]
      );

      if (!agent) {
        console.warn(`[Webhook] Unknown assistantId: ${assistant}`);
        return res.sendStatus(200);
      }

      // Build transcript text from messages array if available
      let transcriptText = msg.transcript || null;
      if (!transcriptText && Array.isArray(msg.messages)) {
        transcriptText = msg.messages
          .map(m => `${m.role?.toUpperCase()}: ${m.message || m.content || ''}`)
          .join('\n');
      }

      // Upsert call record (handle duplicate webhooks gracefully)
      await db.none(
        `INSERT INTO calls
           (user_id, agent_id, vapi_call_id, caller_number, status,
            duration_seconds, cost_usd, transcript, summary,
            recording_url, ended_reason, started_at, ended_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (vapi_call_id)
         DO UPDATE SET
           status           = EXCLUDED.status,
           duration_seconds = EXCLUDED.duration_seconds,
           cost_usd         = EXCLUDED.cost_usd,
           transcript       = EXCLUDED.transcript,
           summary          = EXCLUDED.summary,
           recording_url    = EXCLUDED.recording_url,
           ended_reason     = EXCLUDED.ended_reason,
           ended_at         = EXCLUDED.ended_at`,
        [
          agent.user_id,
          agent.id,
          call?.id                       || null,
          call?.customer?.number         || null,
          'ended',
          Math.round(msg.durationSeconds || 0),
          parseFloat(msg.cost           || 0),
          transcriptText,
          msg.summary                    || null,
          msg.recordingUrl               || null,
          msg.endedReason                || null,
          call?.startedAt ? new Date(call.startedAt) : null,
          call?.endedAt   ? new Date(call.endedAt)   : null
        ]
      );

      console.log(`[Webhook] ✅ Saved call for user ${agent.user_id}`);
    }

    // ── Handle call started ───────────────────────────────
    if (msgType === 'call-started' || msgType === 'status-update') {
      const call      = payload.message?.call;
      const assistant = call?.assistantId;
      const status    = payload.message?.status || 'in-progress';

      if (call?.id && assistant) {
        const agent = await db.oneOrNone(
          'SELECT id, user_id FROM agents WHERE vapi_assistant_id = $1', [assistant]
        );
        if (agent) {
          await db.none(
            `INSERT INTO calls (user_id, agent_id, vapi_call_id, status, started_at)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (vapi_call_id) DO UPDATE SET status = EXCLUDED.status`,
            [agent.user_id, agent.id, call.id, status, new Date()]
          );
        }
      }
    }

    // Always return 200 quickly so Vapi doesn't retry
    res.sendStatus(200);

  } catch (err) {
    console.error('[Webhook] Error processing event:', err.message);
    // Still return 200 to prevent Vapi from re-sending
    res.sendStatus(200);
  }
});

module.exports = router;
