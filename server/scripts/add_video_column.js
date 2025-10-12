// Script to manually add video_url column to posts table
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'classmates_social',
};

async function addVideoColumn() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database');
    
    // Check if column already exists
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM posts LIKE 'video_url'"
    );
    
    if (columns.length > 0) {
      console.log('✓ video_url column already exists');
    } else {
      console.log('Adding video_url column...');
      await connection.query(
        'ALTER TABLE posts ADD COLUMN video_url VARCHAR(255)'
      );
      console.log('✓ video_url column added successfully!');
    }
    
    // Show current table structure
    const [structure] = await connection.query('DESCRIBE posts');
    console.log('\nCurrent posts table structure:');
    console.table(structure);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

addVideoColumn();
