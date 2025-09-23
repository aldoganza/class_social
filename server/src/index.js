// Entry point for Express server
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');

const { pool, ensureDatabaseAndSchema } = require('./lib/db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const followsRoutes = require('./routes/follows');
const messagesRoutes = require('./routes/messages');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require('./routes/notifications');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static for uploads
const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
const uploadAbsPath = path.join(__dirname, '..', uploadDirName);
if (!fs.existsSync(uploadAbsPath)) {
  fs.mkdirSync(uploadAbsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadAbsPath));

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
app.use('/api/notifications', notificationsRoutes);

// Start server after verifying DB
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await ensureDatabaseAndSchema();
    await pool.query('SELECT 1');
    console.log('MySQL connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MySQL:', err && (err.message || err.code || err));
    console.error('DB config used (no password):', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'classmates_social',
    });
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
