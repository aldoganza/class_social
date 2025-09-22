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

// Get followers for a user
router.get('/:id/followers', authRequired, async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.profile_pic
       FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.followed_id = ?`
      , [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get following for a user
router.get('/:id/following', authRequired, async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.profile_pic
       FROM follows f JOIN users u ON u.id = f.followed_id
       WHERE f.follower_id = ?`
      , [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get counts (followers, following, posts)
router.get('/:id/stats', authRequired, async (req, res) => {
  try {
    const userId = req.params.id;
    const [[followers]] = await pool.query('SELECT COUNT(*) AS c FROM follows WHERE followed_id = ?', [userId]);
    const [[following]] = await pool.query('SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?', [userId]);
    const [[posts]] = await pool.query('SELECT COUNT(*) AS c FROM posts WHERE user_id = ?', [userId]);
    res.json({ followers: followers.c || 0, following: following.c || 0, posts: posts.c || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
