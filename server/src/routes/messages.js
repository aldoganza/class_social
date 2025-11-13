const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Configure multer for direct message file uploads
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

async function ensureMessagesExtras() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS messages_hidden (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_hidden (message_id, user_id),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

// Ensure messages table has file_url column to store uploaded file/video links
async function ensureMessagesFileColumn() {
  const [cols] = await pool.execute(`SHOW COLUMNS FROM messages LIKE 'file_url'`);
  if (!cols || cols.length === 0) {
    await pool.execute(`ALTER TABLE messages ADD COLUMN file_url VARCHAR(255) NULL`);
  }
}

// Send a direct message
router.post('/:receiverId', authRequired, upload.single('file'), async (req, res) => {
  try {
    const receiverId = Number(req.params.receiverId);
    const { content } = req.body;

    // Allow sending a message with content OR a file
    if ((!content || !content.trim()) && !req.file) return res.status(400).json({ error: 'Message content or file required' });

    // Ensure columns exist
    await ensureMessagesFileColumn();

    let file_url = null;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      file_url = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const contentVal = content ? content.trim() : '';
    const [result] = await pool.execute(
      'INSERT INTO messages (sender_id, receiver_id, content, file_url) VALUES (?, ?, ?, ?)',
      [req.user.id, receiverId, contentVal, file_url]
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
    await ensureMessagesExtras()
    const otherId = Number(req.params.userId);
    const myId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT m.* FROM messages m
       WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
         AND NOT EXISTS (
           SELECT 1 FROM messages_hidden mh
            WHERE mh.message_id = m.id AND mh.user_id = ?
         )
       ORDER BY m.created_at ASC
       LIMIT 500`,
      [myId, otherId, otherId, myId, myId]
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

// POST /messages/:messageId/hide - delete for me (hide only for current user)
router.post('/:messageId/hide', authRequired, async (req, res) => {
  try {
    await ensureMessagesExtras()
    const messageId = Number(req.params.messageId)
    const myId = req.user.id
    // Validate that the message is part of a conversation with me (optional but safer)
    const [rows] = await pool.execute(
      `SELECT id FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)`,
      [messageId, myId, myId]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Message not found' })
    await pool.execute(
      `INSERT IGNORE INTO messages_hidden (message_id, user_id) VALUES (?, ?)`,
      [messageId, myId]
    )
    res.json({ hidden: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /messages/:messageId/hide - unhide a message (optional)
router.delete('/:messageId/hide', authRequired, async (req, res) => {
  try {
    const messageId = Number(req.params.messageId)
    const myId = req.user.id
    await pool.execute(`DELETE FROM messages_hidden WHERE message_id = ? AND user_id = ?`, [messageId, myId])
    res.json({ hidden: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

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
