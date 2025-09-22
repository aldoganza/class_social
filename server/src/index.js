// Entry point for Express server
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { pool } = require('./lib/db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const followsRoutes = require('./routes/follows');
const messagesRoutes = require('./routes/messages');
const usersRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static for uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/follow', followsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);

// Start server after verifying DB
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }
})();
