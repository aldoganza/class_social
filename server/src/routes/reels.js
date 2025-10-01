const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Multer storage for reels (videos)
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname) || '.mp4'
    cb(null, unique + ext)
  }
});
const upload = multer({ storage });

async function ensureReelsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      video_url VARCHAR(255) NOT NULL,
      caption VARCHAR(280) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_time (user_id, created_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

// POST /api/reels - create a reel (video + optional caption)
router.post('/', authRequired, upload.single('video'), async (req, res) => {
  try {
    await ensureReelsTable();
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Video is required' });
    if (!(file.mimetype || '').startsWith('video/')) return res.status(400).json({ error: 'Only video files allowed' });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const video_url = `${baseUrl}/uploads/${file.filename}`;
    const caption = req.body && typeof req.body.caption === 'string' ? req.body.caption.slice(0, 280) : null;

    const [result] = await pool.execute(
      'INSERT INTO reels (user_id, video_url, caption) VALUES (?, ?, ?)',
      [req.user.id, video_url, caption]
    );

    const [[row]] = await pool.query(
      `SELECT r.*, u.name, u.profile_pic FROM reels r JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
      [result.insertId]
    );
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reels - list recent reels
router.get('/', authRequired, async (req, res) => {
  try {
    await ensureReelsTable();
    const [rows] = await pool.execute(
      `SELECT r.*, u.name, u.profile_pic FROM reels r JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/reels/:id - delete own reel
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[owner]] = await pool.query('SELECT user_id FROM reels WHERE id = ?', [id]);
    if (!owner) return res.status(404).json({ error: 'Reel not found' });
    if (owner.user_id !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
    await pool.execute('DELETE FROM reels WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
