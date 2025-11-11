const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('./db');

async function checkAndInitializeTables() {
  const { host, port, user, password, database } = DB_CONFIG;
  const sqlDir = path.join(__dirname, '..', '..', 'sql');
  
  // Connect to the database
  const connection = await mysql.createConnection({ 
    host, port, user, password, database,
    multipleStatements: true 
  });

  try {
    console.log('Checking database tables...');
    
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
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
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
        await connection.query(sql);
        await connection.query(
          'INSERT INTO migrations (name) VALUES (?)',
          [file]
        );
        console.log(`Applied migration: ${file}`);
      } catch (error) {
        console.error(`Error applying migration ${file}:`, error);
        throw error;
      }
    }
  }
}

module.exports = { checkAndInitializeTables };
