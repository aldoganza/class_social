const express = require('express');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Send a direct message
router.post('/:receiverId', authRequired, async (req, res) => {
  try {
    const receiverId = Number(req.params.receiverId);
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content required' });

    const [result] = await pool.execute(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, receiverId, content]
    );

    const [rows] = await pool.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get conversation between current user and :userId
router.get('/:userId', authRequired, async (req, res) => {
  try {
    const otherId = Number(req.params.userId);
    const myId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT * FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC
       LIMIT 500`,
      [myId, otherId, otherId, myId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
