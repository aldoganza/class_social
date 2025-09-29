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

// Get total unread count for current user (place BEFORE parameterized routes)
router.get('/me/unread/count', authRequired, async (req, res) => {
  try {
    const myId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS cnt FROM messages WHERE receiver_id = ? AND read_at IS NULL`,
      [myId]
    );
    res.json({ count: rows[0].cnt || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List conversations with last message and unread counts
router.get('/conversations', authRequired, async (req, res) => {
  try {
    const myId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.profile_pic,
        (SELECT COUNT(*) FROM messages m
           WHERE m.sender_id = u.id AND m.receiver_id = ? AND m.read_at IS NULL) AS unread_count,
        (SELECT content FROM messages m
           WHERE (m.sender_id = ? AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = ?)
           ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages m
           WHERE (m.sender_id = ? AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = ?)
           ORDER BY m.created_at DESC LIMIT 1) AS last_time
       FROM (
         SELECT DISTINCT other_id FROM (
           SELECT receiver_id AS other_id FROM messages WHERE sender_id = ?
           UNION
           SELECT sender_id AS other_id FROM messages WHERE receiver_id = ?
         ) x
       ) conv
       JOIN users u ON u.id = conv.other_id
       ORDER BY last_time DESC
       LIMIT 100`,
      [myId, myId, myId, myId, myId, myId, myId]
    );
    res.json(rows);
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

    // Mark all messages sent by otherId to me as read
    await pool.execute(
      `UPDATE messages SET read_at = NOW()
       WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`,
      [otherId, myId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark conversation as read explicitly
router.post('/:userId/read', authRequired, async (req, res) => {
  try {
    const otherId = Number(req.params.userId);
    const myId = req.user.id;
    const [result] = await pool.execute(
      `UPDATE messages SET read_at = NOW()
       WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`,
      [otherId, myId]
    );
    res.json({ updated: result.affectedRows || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /messages/:messageId - sender can unsend (delete) their own message
router.delete('/:messageId', authRequired, async (req, res) => {
  try {
    const messageId = Number(req.params.messageId)
    const myId = req.user.id
    // Ensure the message exists and is owned by the requester
    const [rows] = await pool.execute('SELECT id, sender_id FROM messages WHERE id = ?', [messageId])
    if (rows.length === 0) return res.status(404).json({ error: 'Message not found' })
    if (rows[0].sender_id !== myId) return res.status(403).json({ error: 'Not allowed' })
    await pool.execute('DELETE FROM messages WHERE id = ? AND sender_id = ?', [messageId, myId])
    res.json({ deleted: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router;
