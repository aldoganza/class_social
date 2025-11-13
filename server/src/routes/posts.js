const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../lib/db');
const { createNotification } = require('../lib/notifications');
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

// POST /api/posts - create a post (text + optional image/video)
router.post('/', authRequired, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { content } = req.body;
    let image_url = null;
    let video_url = null;
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    if (req.files && req.files.image && req.files.image[0]) {
      image_url = `${baseUrl}/uploads/${req.files.image[0].filename}`;
    }
    
    if (req.files && req.files.video && req.files.video[0]) {
      video_url = `${baseUrl}/uploads/${req.files.video[0].filename}`;
    }

    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, content, image_url, video_url) VALUES (?, ?, ?, ?)',
      [req.user.id, content || null, image_url, video_url]
    );

    const [rows] = await pool.execute(
      `SELECT p.*, u.name, u.profile_pic,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked_by_me
       FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`,
      [req.user.id, result.insertId]
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
      `SELECT p.*, u.name, u.profile_pic,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? OR p.user_id IN (
         SELECT followed_id FROM follows WHERE follower_id = ?
       )
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [userId, userId, userId]
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
      `SELECT p.*, u.name, u.profile_pic,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 100`,
      [req.user.id, userId]
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
      `SELECT p.*, u.name, u.profile_pic,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 100`
      , [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a post
router.post('/:id/like', authRequired, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const [result] = await pool.execute('INSERT IGNORE INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, postId]);
    // Notify post owner on new like (only if insert happened)
    if (result && result.affectedRows > 0) {
      const [[owner]] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
      if (owner && owner.user_id) {
        await createNotification({ userId: owner.user_id, actorId: req.user.id, type: 'like', postId })
      }
    }
    // Return new counts
    const [[metrics]] = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM likes WHERE post_id = ?) AS likes_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = ?) AS comments_count`,
      [postId, postId]
    );
    res.json({ success: true, liked: true, ...metrics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlike a post
router.delete('/:id/like', authRequired, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    await pool.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);
    const [[metrics]] = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM likes WHERE post_id = ?) AS likes_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = ?) AS comments_count`,
      [postId, postId]
    );
    res.json({ success: true, liked: false, ...metrics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List comments for a post
router.get('/:id/comments', authRequired, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const [rows] = await pool.execute(
      `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.name, u.profile_pic
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? ORDER BY c.created_at ASC LIMIT 200`,
      [postId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a comment to a post
router.post('/:id/comments', authRequired, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content required' });
    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content.trim()]
    );
    const [[comment]] = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.name, u.profile_pic
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [result.insertId]
    );
    // Notify post owner on comment
    const [[owner]] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (owner && owner.user_id) {
      await createNotification({ userId: owner.user_id, actorId: req.user.id, type: 'comment', postId, commentId: result.insertId })
    }
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/posts/:id - delete own post
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    // Ensure the post belongs to the requesting user
    const [rows] = await pool.execute('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not allowed' });

    await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
