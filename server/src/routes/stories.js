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

// DELETE /api/stories/:id - delete own story
router.delete('/:id', authRequired, async (req, res) => {
  try {
    await ensureStoriesTable()
    const storyId = Number(req.params.id)
    // Verify ownership
    const [rows] = await pool.execute('SELECT user_id FROM stories WHERE id = ?', [storyId])
    if (rows.length === 0) return res.status(404).json({ error: 'Story not found' })
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not allowed' })

    await pool.execute('DELETE FROM stories WHERE id = ?', [storyId])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
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

async function ensureStoryTextColumns() {
  // Add optional text overlay columns if they don't exist
  await pool.execute(`
    ALTER TABLE stories
      ADD COLUMN IF NOT EXISTS text VARCHAR(280) NULL,
      ADD COLUMN IF NOT EXISTS text_color VARCHAR(16) NULL,
      ADD COLUMN IF NOT EXISTS text_bg VARCHAR(16) NULL,
      ADD COLUMN IF NOT EXISTS text_pos ENUM('top','center','bottom') NULL DEFAULT 'bottom'
  `)
}

async function ensureStoryExtras() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS stories_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      story_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_story_like (story_id, user_id),
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS stories_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      story_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_story_view (story_id, user_id),
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

// POST /api/stories - create a story (image or video, optional audio for image)
router.post('/', authRequired, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
  try {
    await ensureStoriesTable(); await ensureStoryExtras(); await ensureStoryTextColumns()
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

    const text = (req.body && typeof req.body.text === 'string') ? req.body.text.slice(0, 280) : null
    const text_color = (req.body && req.body.text_color) || null
    const text_bg = (req.body && req.body.text_bg) || null
    const text_pos = (req.body && req.body.text_pos) || 'bottom'

    const [result] = await pool.execute(
      'INSERT INTO stories (user_id, media_url, media_type, audio_url, expires_at, text, text_color, text_bg, text_pos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, media_url, media_type, audio_url, expires_at, text, text_color, text_bg, text_pos]
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
    await ensureStoriesTable(); await ensureStoryExtras()
    const [rows] = await pool.execute(
      `SELECT s.*, u.name, u.profile_pic,
              (SELECT COUNT(*) FROM stories_likes sl WHERE sl.story_id = s.id) AS likes_count,
              (SELECT COUNT(*) FROM stories_views sv WHERE sv.story_id = s.id) AS views_count,
              EXISTS(SELECT 1 FROM stories_likes sl2 WHERE sl2.story_id = s.id AND sl2.user_id = ?) AS liked_by_me
         FROM stories s
         JOIN users u ON u.id = s.user_id
        WHERE s.expires_at > NOW()
          AND (s.user_id = ? OR s.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?))
        ORDER BY s.created_at DESC
        LIMIT 200`,
      [req.user.id, req.user.id, req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/stories/:id/like - like story
router.post('/:id/like', authRequired, async (req, res) => {
  try {
    await ensureStoriesTable(); await ensureStoryExtras()
    const storyId = Number(req.params.id)
    await pool.execute('INSERT IGNORE INTO stories_likes (story_id, user_id) VALUES (?, ?)', [storyId, req.user.id])
    const [[m]] = await pool.query('SELECT COUNT(*) AS likes_count FROM stories_likes WHERE story_id = ?', [storyId])
    res.json({ liked: true, likes_count: Number(m.likes_count || 0) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/stories/:id/like - unlike story
router.delete('/:id/like', authRequired, async (req, res) => {
  try {
    await ensureStoryExtras()
    const storyId = Number(req.params.id)
    await pool.execute('DELETE FROM stories_likes WHERE story_id = ? AND user_id = ?', [storyId, req.user.id])
    const [[m]] = await pool.query('SELECT COUNT(*) AS likes_count FROM stories_likes WHERE story_id = ?', [storyId])
    res.json({ liked: false, likes_count: Number(m.likes_count || 0) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/stories/:id/view - mark as viewed
router.post('/:id/view', authRequired, async (req, res) => {
  try {
    await ensureStoryExtras()
    const storyId = Number(req.params.id)
    await pool.execute('INSERT IGNORE INTO stories_views (story_id, user_id) VALUES (?, ?)', [storyId, req.user.id])
    const [[m]] = await pool.query('SELECT COUNT(*) AS views_count FROM stories_views WHERE story_id = ?', [storyId])
    res.json({ success: true, views_count: Number(m.views_count || 0) })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/stories/:id/viewers - list viewers
router.get('/:id/viewers', authRequired, async (req, res) => {
  try {
    await ensureStoryExtras()
    const storyId = Number(req.params.id)
    // Only owner can see full viewer list
    const [[owner]] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [storyId])
    if (!owner) return res.status(404).json({ error: 'Story not found' })
    if (owner.user_id !== req.user.id) return res.status(403).json({ error: 'Not allowed' })
    const [rows] = await pool.query(
      `SELECT 
            u.id, 
            u.name, 
            u.profile_pic, 
            sv.created_at,
            EXISTS(
              SELECT 1 
                FROM stories_likes sl 
               WHERE sl.story_id = sv.story_id 
                 AND sl.user_id = sv.user_id
            ) AS liked
           FROM stories_views sv 
           JOIN users u ON u.id = sv.user_id
          WHERE sv.story_id = ?
          ORDER BY sv.created_at DESC
          LIMIT 200`,
      [storyId]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
