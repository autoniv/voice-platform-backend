// ============================================================
//  routes/auth.js  —  Register & Login
//  POST /api/auth/register
//  POST /api/auth/login
//  GET  /api/auth/me   (protected — get current user profile)
// ============================================================
const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const { db }   = require('../db');
const auth     = require('../middleware/auth');

// ── Helper: create a signed JWT ───────────────────────────
function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, company } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check if email already registered
    const existing = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password and create user
    const hash = await bcrypt.hash(password, 12);
    const user = await db.one(
      `INSERT INTO users (email, password_hash, full_name, company)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, company, plan, call_limit, created_at`,
      [email.toLowerCase(), hash, full_name || null, company || null]
    );

    const token = signToken(user);
    res.status(201).json({ token, user });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.oneOrNone(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);

    // Return user without password hash
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.oneOrNone(
      'SELECT id, email, full_name, company, plan, call_limit, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

module.exports = router;
