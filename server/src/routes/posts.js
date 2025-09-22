const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// POST /api/posts - create a post (text + optional image)
router.post('/', authRequired, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    let image_url = null;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      image_url = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [req.user.id, content || null, image_url]
    );

    const [rows] = await pool.execute(
      'SELECT p.*, u.name, u.profile_pic FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/feed - posts from self and followed users
router.get('/feed', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT p.*, u.name, u.profile_pic
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? OR p.user_id IN (
         SELECT followed_id FROM follows WHERE follower_id = ?
       )
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [userId, userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/user/:id - posts by user
router.get('/user/:id', authRequired, async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT p.*, u.name, u.profile_pic FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 100`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/posts/explore - recent posts from all users
router.get('/explore', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, u.name, u.profile_pic FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
