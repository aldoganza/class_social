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
const storiesRoutes = require('./routes/stories');
const reelsRoutes = require('./routes/reels');
const groupsRoutes = require('./routes/groups');

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
app.use('/api/follows', followsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/groups', groupsRoutes);

// Start server after verifying DB
const PORT = process.env.PORT || 4000;
const { DB_CONFIG } = require('./lib/db');

async function startServerWithRetries(retries = 5, baseDelayMs = 1000) {
  // Allow skipping DB for quick frontend/dev without a database
  if (process.env.SKIP_DB === 'true') {
    console.warn('SKIP_DB=true; skipping database initialization. Server will start but routes depending on DB may error.');
    app.listen(PORT, () => console.log(`Server running without DB on http://localhost:${PORT}`));
    return;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`DB connect attempt ${attempt}/${retries}...`);
      await ensureDatabaseAndSchema();
      await pool.query('SELECT 1');
      console.log('MySQL connected');
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
      return;
    } catch (err) {
      const msg = err && (err.message || err.code || err);
      console.error(`Database connection failed (attempt ${attempt}):`, msg);
      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${Math.round(delay / 1000)}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('Exceeded database connection retries. Last error: ', msg);
        console.error('DB config used (no password):', {
          host: DB_CONFIG.host,
          port: DB_CONFIG.port,
          user: DB_CONFIG.user,
          database: DB_CONFIG.database,
        });
        console.error('Common causes: MySQL server not running, wrong host/port, firewall, or network issue.');
        if (err && err.stack) console.error(err.stack);
        process.exit(1);
      }
    }
  }
}

startServerWithRetries().catch(err => {
  console.error('Unexpected startup error:', err);
  process.exit(1);
});
