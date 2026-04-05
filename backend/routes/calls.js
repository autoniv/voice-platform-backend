// ============================================================
//  routes/calls.js  —  Read call history & details
//
//  Data is populated automatically by the webhook (Option A).
//  These endpoints let the frontend display call logs,
//  transcripts, and per-agent summaries.
// ============================================================
const express = require('express');
const router  = express.Router();
const { db }  = require('../db');
const auth    = require('../middleware/auth');

// ── GET /api/calls  —  Paginated call list ─────────────────
router.get('/', auth, async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(50, parseInt(req.query.limit) || 20);
    const offset   = (page - 1) * limit;
    const agentId  = req.query.agent_id || null;
    const status   = req.query.status   || null;

    // Build dynamic WHERE clause
    const conditions = ['c.user_id = $1'];
    const params     = [req.user.userId];
    let   pIdx       = 2;

    if (agentId) { conditions.push(`c.agent_id = $${pIdx++}`); params.push(agentId); }
    if (status)  { conditions.push(`c.status   = $${pIdx++}`); params.push(status); }

    const where = conditions.join(' AND ');

    const [calls, countRow] = await Promise.all([
      db.any(
        `SELECT
           c.id, c.vapi_call_id, c.caller_number, c.status,
           c.duration_seconds, c.cost_usd, c.ended_reason,
           c.started_at, c.ended_at,
           a.name AS agent_name
         FROM calls c
         LEFT JOIN agents a ON a.id = c.agent_id
         WHERE ${where}
         ORDER BY c.started_at DESC NULLS LAST
         LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
        [...params, limit, offset]
      ),
      db.one(`SELECT COUNT(*) FROM calls c WHERE ${where}`, params)
    ]);

    res.json({
      calls,
      pagination: {
        page,
        limit,
        total: parseInt(countRow.count),
        pages: Math.ceil(countRow.count / limit)
      }
    });
  } catch (err) {
    console.error('List calls error:', err.message);
    res.status(500).json({ error: 'Could not fetch calls.' });
  }
});

// ── GET /api/calls/:id  —  Single call with full transcript ─
router.get('/:id', auth, async (req, res) => {
  try {
    const call = await db.oneOrNone(
      `SELECT
         c.*, a.name AS agent_name
       FROM calls c
       LEFT JOIN agents a ON a.id = c.agent_id
       WHERE c.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (!call) return res.status(404).json({ error: 'Call not found.' });
    res.json(call);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch call details.' });
  }
});

// ── GET /api/calls/analytics/summary  —  Dashboard stats ──
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [totals, dailyVolume, topAgents, statusBreakdown] = await Promise.all([

      // Overall totals
      db.one(
        `SELECT
           COUNT(*)                                        AS total_calls,
           COALESCE(SUM(duration_seconds), 0)             AS total_seconds,
           COALESCE(SUM(cost_usd), 0)                     AS total_cost,
           COUNT(*) FILTER (WHERE status = 'ended')       AS completed_calls,
           ROUND(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0)) AS avg_duration
         FROM calls WHERE user_id = $1`,
        [userId]
      ),

      // Daily call volume (last 30 days)
      db.any(
        `SELECT
           DATE(COALESCE(started_at, created_at)) AS date,
           COUNT(*)                               AS calls,
           COALESCE(SUM(duration_seconds), 0)     AS total_seconds
         FROM calls
         WHERE user_id = $1
           AND COALESCE(started_at, created_at) >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(COALESCE(started_at, created_at))
         ORDER BY date ASC`,
        [userId]
      ),

      // Top agents by call count
      db.any(
        `SELECT
           a.name, COUNT(c.id) AS call_count,
           COALESCE(SUM(c.duration_seconds), 0) AS total_seconds
         FROM calls c
         JOIN agents a ON a.id = c.agent_id
         WHERE c.user_id = $1
         GROUP BY a.id, a.name
         ORDER BY call_count DESC
         LIMIT 5`,
        [userId]
      ),

      // Status breakdown
      db.any(
        `SELECT status, COUNT(*) AS count
         FROM calls WHERE user_id = $1
         GROUP BY status ORDER BY count DESC`,
        [userId]
      )
    ]);

    res.json({ totals, dailyVolume, topAgents, statusBreakdown });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: 'Could not fetch analytics.' });
  }
});

module.exports = router;
