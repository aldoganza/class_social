const express = require('express');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Get user by id
router.get('/:id', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, profile_pic, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users by name or email
router.get('/', authRequired, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const like = `%${q}%`;
    const [rows] = await pool.execute(
      'SELECT id, name, email, profile_pic FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 20',
      [like, like]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
