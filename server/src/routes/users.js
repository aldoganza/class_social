const express = require('express');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Storage for profile pictures (same uploads dir as server index)
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads')
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})

// GET current user's settings
router.get('/me/settings', authRequired, async (req, res) => {
  try {
    await ensureUserSettings()
    const [[row]] = await pool.query('SELECT privacy_private, messages_followers_only, email_notifications FROM user_settings WHERE user_id = ?', [req.user.id])
    if (!row) {
      // Return defaults
      return res.json({ privacy_private: 0, messages_followers_only: 0, email_notifications: 1 })
    }
    res.json(row)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH current user's settings
router.patch('/me/settings', authRequired, async (req, res) => {
  try {
    await ensureUserSettings()
    const { privacy_private, messages_followers_only, email_notifications } = req.body || {}
    // Normalize to 0/1
    const vals = {
      privacy_private: Number(!!privacy_private),
      messages_followers_only: Number(!!messages_followers_only),
      email_notifications: Number(!!email_notifications),
    }
    await pool.execute(`
      INSERT INTO user_settings (user_id, privacy_private, messages_followers_only, email_notifications)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        privacy_private = VALUES(privacy_private),
        messages_followers_only = VALUES(messages_followers_only),
        email_notifications = VALUES(email_notifications)
    `, [req.user.id, vals.privacy_private, vals.messages_followers_only, vals.email_notifications])
    res.json(vals)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})
const upload = multer({ storage })

async function ensureUserSettings() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INT PRIMARY KEY,
      privacy_private TINYINT(1) DEFAULT 0,
      messages_followers_only TINYINT(1) DEFAULT 0,
      email_notifications TINYINT(1) DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

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

// Update current user's profile (name and/or profile picture)
router.patch('/me', authRequired, upload.single('profile_pic'), async (req, res) => {
  try {
    const fields = []
    const params = []
    const { name } = req.body
    if (name && name.trim()) {
      fields.push('name = ?')
      params.push(name.trim())
    }
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`
      const url = `${baseUrl}/uploads/${req.file.filename}`
      fields.push('profile_pic = ?')
      params.push(url)
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No changes provided' })
    params.push(req.user.id)
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)

    const [[user]] = await pool.query('SELECT id, name, email, profile_pic FROM users WHERE id = ?', [req.user.id])
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})
