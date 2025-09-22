const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Helper to generate JWT
function signToken(user) {
  const payload = { id: user.id };
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, profile_pic } = req.body;

    try {
      // Check if email exists
      const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password_hash, profile_pic) VALUES (?, ?, ?, ?)',
        [name, email, hash, profile_pic || null]
      );

      const user = { id: result.insertId, name, email, profile_pic: profile_pic || null };
      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const [rows] = await pool.execute('SELECT id, name, email, password_hash, profile_pic FROM users WHERE email = ?', [email]);
      if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

      const token = signToken(user);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, profile_pic: user.profile_pic } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, profile_pic, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
