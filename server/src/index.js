// Entry point for Express server
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const mysql = require('mysql2/promise');

const { pool, DB_CONFIG } = require('./lib/db');
const { checkAndInitializeTables } = require('./lib/init-db');
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
let serverInstance = null;
function safeListen() {
  if (serverInstance) return;
  try {
    serverInstance = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    serverInstance.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Another process is listening on this port.`);
        console.error('You can change the port by setting PORT environment variable or stop the other process.');
        // exit gracefully
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}
async function startServerWithRetries(retries = 5, baseDelayMs = 1000) {
  // Allow skipping DB for quick frontend/dev without a database
  if (process.env.SKIP_DB === 'true') {
    console.warn('SKIP_DB=true; skipping database initialization. Server will start but routes depending on DB may error.');
    safeListen();
    return;
  }

  console.log('Starting database connection...');
  console.log('Database configuration:', {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    database: DB_CONFIG.database,
    usingPassword: !!DB_CONFIG.password
  });
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n=== Database Connection Attempt ${attempt}/${retries} ===`);
      
      try {
        // Try to connect to the database
        const connection = await mysql.createConnection({
          host: DB_CONFIG.host,
          port: DB_CONFIG.port,
          user: DB_CONFIG.user,
          password: DB_CONFIG.password,
          database: DB_CONFIG.database,
          connectTimeout: 10000,
          multipleStatements: true
        });
        
        // Test the connection
        await connection.ping();
        console.log('✅ Successfully connected to MySQL server');
        
        // Check if database exists
        const [rows] = await connection.query(
          `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
          [DB_CONFIG.database]
        );
        
        if (rows.length === 0) {
          console.log(`Database '${DB_CONFIG.database}' does not exist, creating...`);
          await connection.query(
            `CREATE DATABASE \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          );
          console.log(`✅ Created database '${DB_CONFIG.database}'`);
        }
        
        // Close the connection as we'll use the pool from now on
        await connection.end();
        
        // Initialize tables and apply migrations
        console.log('Initializing database tables...');
        await checkAndInitializeTables();
        
        // Test the connection with the pool
        await pool.query('SELECT 1');
        console.log('✅ Database connection and initialization successful');
        safeListen();
        return;
        
      } catch (err) {
        console.error('Database connection error:', err);
        if (attempt === retries) throw err;
      }
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
        // Fall back to starting the server in degraded mode instead of exiting so frontend/dev can continue
        console.warn('Starting server in degraded mode (DB unavailable). Routes depending on the DB will return errors.');
        app.locals.dbAvailable = false;
        safeListen();
        return;
      }
    }
  }
}

startServerWithRetries().catch(err => {
  console.error('Unexpected startup error:', err);
  process.exit(1);
});
