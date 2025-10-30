const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../lib/email');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Helper to generate JWT
function signToken(user) {
  const payload = { id: user.id };
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// Multer storage for profile pictures
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// POST /api/auth/signup
router.post(
  '/signup',
  upload.single('profile_pic'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
      // Check if email exists
      const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

      const hash = await bcrypt.hash(password, 10);
      let profilePicUrl = null;
      if (req.file) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
        profilePicUrl = `${baseUrl}/uploads/${req.file.filename}`;
      }
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password_hash, profile_pic) VALUES (?, ?, ?, ?)',
        [name, email, hash, profilePicUrl]
      );

      const user = { id: result.insertId, name, email, profile_pic: profilePicUrl };
      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const [rows] = await pool.execute('SELECT id, name, email, password_hash, profile_pic FROM users WHERE email = ?', [email]);
      if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

      const token = signToken(user);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, profile_pic: user.profile_pic } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, profile_pic, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// PATCH /api/auth/password - change password for logged-in user
router.patch('/password', authRequired, [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password min 6 chars'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { current_password, new_password } = req.body;
  try {
    const [[user]] = await pool.query('SELECT id, password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(current_password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Current password incorrect' });
    const newHash = await bcrypt.hash(new_password, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;

  try {
    // Check if user exists
    const [users] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email]);
    
    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }

    const user = users[0];
    
    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await pool.execute(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token_hash = ?, expires_at = ?',
      [user.id, resetTokenHash, expiresAt, resetTokenHash, expiresAt]
    );

    // Send password reset email
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(email, resetUrl, user.name);

    res.json({ 
      success: true, 
      message: 'If that email exists, a reset link has been sent'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { token, password } = req.body;

  try {
    // Hash the token to compare with database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const [resets] = await pool.execute(
      'SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );

    if (resets.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = resets[0].user_id;

    // Update password
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);

    // Delete used token
    await pool.execute('DELETE FROM password_resets WHERE user_id = ?', [userId]);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
