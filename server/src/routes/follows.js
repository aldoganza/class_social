const express = require('express');
const { pool } = require('../lib/db');
const { createNotification } = require('../lib/notifications');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Follow a user
router.post('/:userId', authRequired, async (req, res) => {
  const targetId = Number(req.params.userId);
  if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });
  try {
    const [result] = await pool.execute(
      'INSERT IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)',
      [req.user.id, targetId]
    );
    // If a row was inserted (not ignored), create notification for the followed user
    if (result && result.affectedRows > 0) {
      await createNotification({ userId: targetId, actorId: req.user.id, type: 'follow' })
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow a user
router.delete('/:userId', authRequired, async (req, res) => {
  const targetId = Number(req.params.userId);
  try {
    await pool.execute(
      'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?',
      [req.user.id, targetId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get following list
router.get('/following', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.profile_pic
       FROM follows f JOIN users u ON u.id = f.followed_id
       WHERE f.follower_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
