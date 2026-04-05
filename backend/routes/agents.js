// ============================================================
//  routes/agents.js  —  Create / Read / Update / Delete agents
//
//  All routes are protected (require JWT).
//  When a client creates an agent here, we:
//    1. Create the assistant on Vapi using YOUR secret key
//    2. Store the returned vapi_assistant_id in our DB
//    3. Return our own agent record to the client
//
//  Clients NEVER see the Vapi API key or raw Vapi IDs in
//  a way that lets them call Vapi directly.
// ============================================================
const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { db }  = require('../db');
const auth    = require('../middleware/auth');

// ── Vapi helper ───────────────────────────────────────────
const vapiClient = axios.create({
  baseURL: 'https://api.vapi.ai',
  headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` }
});

// ── GET /api/agents  —  List all agents for logged-in user ─
router.get('/', auth, async (req, res) => {
  try {
    const agents = await db.any(
      `SELECT id, name, voice_id, language, system_prompt,
              first_message, is_active, created_at
       FROM agents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(agents);
  } catch (err) {
    console.error('List agents error:', err.message);
    res.status(500).json({ error: 'Could not fetch agents.' });
  }
});

// ── POST /api/agents  —  Create a new agent ───────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      system_prompt,
      first_message,
      voice_id   = 'paula',
      language   = 'en'
    } = req.body;

    if (!name || !system_prompt) {
      return res.status(400).json({ error: 'Agent name and system prompt are required.' });
    }

    // ── Step 1: Create assistant on Vapi ─────────────────
    const vapiPayload = {
      name,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: system_prompt
          }
        ]
      },
      voice: {
        provider: '11labs',
        voiceId: voice_id
      },
      firstMessage: first_message || `Hello! I'm ${name}. How can I help you today?`,
      firstMessageMode: 'assistant-speaks-first',
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: language
      },
      // Send events to our webhook
      serverUrl: `${process.env.BACKEND_URL || 'https://your-backend.railway.app'}/api/webhooks/vapi`
    };

    const vapiRes = await vapiClient.post('/assistant', vapiPayload);
    const vapiAssistantId = vapiRes.data.id;

    // ── Step 2: Save to our database ─────────────────────
    const agent = await db.one(
      `INSERT INTO agents
         (user_id, name, vapi_assistant_id, voice_id, language, system_prompt, first_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, voice_id, language, system_prompt, first_message, is_active, created_at`,
      [req.user.userId, name, vapiAssistantId, voice_id, language, system_prompt, first_message]
    );

    res.status(201).json(agent);

  } catch (err) {
    console.error('Create agent error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create agent. Check your Vapi API key.' });
  }
});

// ── PATCH /api/agents/:id  —  Update an agent ─────────────
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, system_prompt, first_message, voice_id, language, is_active } = req.body;

    // Verify ownership
    const existing = await db.oneOrNone(
      'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    if (!existing) return res.status(404).json({ error: 'Agent not found.' });

    // Update on Vapi
    if (existing.vapi_assistant_id) {
      const updates = {};
      if (name)          updates.name = name;
      if (system_prompt) updates.model = { provider: 'openai', model: 'gpt-4o', messages: [{ role: 'system', content: system_prompt }] };
      if (first_message) updates.firstMessage = first_message;
      if (voice_id)      updates.voice = { provider: '11labs', voiceId: voice_id };
      await vapiClient.patch(`/assistant/${existing.vapi_assistant_id}`, updates).catch(() => {});
    }

    // Update in our DB
    const updated = await db.one(
      `UPDATE agents SET
         name          = COALESCE($1, name),
         system_prompt = COALESCE($2, system_prompt),
         first_message = COALESCE($3, first_message),
         voice_id      = COALESCE($4, voice_id),
         language      = COALESCE($5, language),
         is_active     = COALESCE($6, is_active)
       WHERE id = $7 AND user_id = $8
       RETURNING id, name, voice_id, language, system_prompt, first_message, is_active, created_at`,
      [name, system_prompt, first_message, voice_id, language, is_active, id, req.user.userId]
    );

    res.json(updated);

  } catch (err) {
    console.error('Update agent error:', err.message);
    res.status(500).json({ error: 'Failed to update agent.' });
  }
});

// ── DELETE /api/agents/:id  —  Delete an agent ────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await db.oneOrNone(
      'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    // Delete from Vapi
    if (agent.vapi_assistant_id) {
      await vapiClient.delete(`/assistant/${agent.vapi_assistant_id}`).catch(() => {});
    }

    // Delete from our DB (cascades to calls via SET NULL)
    await db.none('DELETE FROM agents WHERE id = $1', [id]);

    res.json({ message: 'Agent deleted successfully.' });

  } catch (err) {
    console.error('Delete agent error:', err.message);
    res.status(500).json({ error: 'Failed to delete agent.' });
  }
});

module.exports = router;
