const express = require('express')
const multer = require('multer')
const path = require('path')
const { pool } = require('../lib/db')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// Storage
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})
const upload = multer({ storage })

async function ensureStoriesTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS stories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      media_url VARCHAR(255) NOT NULL,
      media_type ENUM('image','video') NOT NULL,
      audio_url VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      INDEX idx_user_time (user_id, created_at),
      INDEX idx_expires (expires_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

// POST /api/stories - create a story (image or video, optional audio for image)
router.post('/', authRequired, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
  try {
    await ensureStoriesTable()
    const mediaFile = req.files && req.files.media && req.files.media[0]
    const audioFile = req.files && req.files.audio && req.files.audio[0]
    if (!mediaFile) return res.status(400).json({ error: 'Media is required' })

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`
    const media_url = `${baseUrl}/uploads/${mediaFile.filename}`
    const audio_url = audioFile ? `${baseUrl}/uploads/${audioFile.filename}` : null
    const isVideo = (mediaFile.mimetype || '').startsWith('video/')
    const isImage = (mediaFile.mimetype || '').startsWith('image/')
    const media_type = isVideo ? 'video' : (isImage ? 'image' : null)
    if (!media_type) return res.status(400).json({ error: 'Unsupported media type' })

    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const [result] = await pool.execute(
      'INSERT INTO stories (user_id, media_url, media_type, audio_url, expires_at) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, media_url, media_type, audio_url, expires_at]
    )

    const [[row]] = await pool.query(
      `SELECT s.*, u.name, u.profile_pic FROM stories s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
      [result.insertId]
    )

    res.status(201).json(row)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/stories - list recent stories (self + followed) not expired
router.get('/', authRequired, async (req, res) => {
  try {
    await ensureStoriesTable()
    const [rows] = await pool.execute(
      `SELECT s.*, u.name, u.profile_pic
         FROM stories s
         JOIN users u ON u.id = s.user_id
        WHERE s.expires_at > NOW()
          AND (s.user_id = ? OR s.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?))
        ORDER BY s.created_at DESC
        LIMIT 200`,
      [req.user.id, req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
