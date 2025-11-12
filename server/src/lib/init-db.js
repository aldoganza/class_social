const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('./db');

// Helper to create a connection with retry logic
async function createConnectionWithRetry(config, maxRetries = 5, baseDelayMs = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await mysql.createConnection({
        ...config,
        connectTimeout: 10000, // 10 second timeout
      });
      await connection.ping();
      return connection;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`Connection attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${lastError.message}`);
}

async function checkAndInitializeTables() {
  const { host, port, user, password, database } = DB_CONFIG;
  const sqlDir = path.join(__dirname, '..', '..', 'sql');
  
  console.log('Attempting to connect to database...', { 
    host, 
    port, 
    user, 
    database,
    usingPassword: !!password
  });
  
  let connection;
  try {
    // First, connect without specifying the database
    connection = await createConnectionWithRetry({
      host, 
      port, 
      user, 
      password,
      multipleStatements: true
    });

    console.log('Checking database tables...');
    
    // Check if database exists
    const [dbs] = await connection.query(
      `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [database]
    );
    
    if (dbs.length === 0) {
      console.log(`Database '${database}' does not exist, creating...`);
      await connection.query(
        `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`✅ Created database '${database}'`);
    }
    
    // Now connect to the specific database
    await connection.changeUser({ database });
    
    // Check if users table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`, 
      [database]
    );

    // If users table doesn't exist, initialize the database
    if (tables.length === 0) {
      console.log('Initializing database tables...');
      const schemaPath = path.join(sqlDir, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Remove DROP TABLE statements to prevent data loss
        const initSql = schemaSql
          .split(';')
          .filter(stmt => !stmt.trim().toUpperCase().startsWith('DROP TABLE'))
          .join(';');
        
        await connection.query(initSql);
        console.log('Database tables created successfully');
      } else {
        console.error('Schema file not found');
        process.exit(1);
      }
    } else {
      console.log('Database tables already exist, skipping initialization');
    }

    // Apply any pending migrations/alters
    await applyMigrations(connection, sqlDir);
    
  } catch (error) {
    console.error('Error in checkAndInitializeTables:', error);
    throw error;
  } finally {
    if (connection && connection.end) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
  }
}

async function applyMigrations(connection, sqlDir) {
  const migrationFiles = [
    'alter_add_likes_comments.sql',
    'alter_add_read_at.sql',
    'alter_add_video_url.sql',
    'alter_add_groups.sql',
    'alter_add_notifications_stories_settings.sql',
    'alter_add_password_resets.sql'
  ];

  // Create migrations table if it doesn't exist
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const file of migrationFiles) {
    const filePath = path.join(sqlDir, file);
    if (!fs.existsSync(filePath)) continue;

    // Check if migration was already applied
    const [applied] = await connection.query(
      'SELECT 1 FROM migrations WHERE name = ?',
      [file]
    );

    if (applied.length === 0) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        // Handle specific migration errors gracefully
        await connection.query(sql);
        await connection.query(
          'INSERT INTO migrations (name) VALUES (?)',
          [file]
        );
        console.log(`✅ Applied migration: ${file}`);
      } catch (error) {
        // Handle duplicate column/index errors gracefully
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_DUP_KEYNAME' || 
            error.code === 'ER_DUP_INDEX') {
          console.log(`⚠️  Migration ${file} already applied (${error.code}), marking as complete`);
          await connection.query(
            'INSERT INTO migrations (name) VALUES (?)',
            [file]
          );
        } else {
          console.error(`❌ Error applying migration ${file}:`, error);
          throw error;
        }
      }
    } else {
      console.log(`⏭️  Migration ${file} already applied, skipping`);
    }
  }
}

module.exports = { checkAndInitializeTables };
