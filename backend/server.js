// ============================================================
//  server.js  —  Main entry point
// ============================================================
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const app     = express();

// ── CORS: Allow only your frontend domain ─────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000'
  ],
  credentials: true
}));

// ── Body parsing ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/agents',   require('./routes/agents'));
app.use('/api/calls',    require('./routes/calls'));
app.use('/api/webhooks', require('./routes/webhooks'));

// ── Health check (Railway / Render use this) ──────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── 404 catch-all ─────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Voice Platform Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
