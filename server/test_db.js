// Quick test to check database tables
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDB() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
  };

  console.log('Connecting to DB:', { ...config, password: '***' });
  
  try {
    const conn = await mysql.createConnection(config);
    console.log('✓ Connected to database');
    
    // Check if tables exist
    const [tables] = await conn.query('SHOW TABLES');
    console.log('\nTables in database:');
    if (tables.length === 0) {
      console.log('  (no tables found)');
    } else {
      tables.forEach(row => {
        const tableName = Object.values(row)[0];
        console.log(`  - ${tableName}`);
      });
    }
    
    // Try to describe users table
    try {
      const [columns] = await conn.query('DESCRIBE users');
      console.log('\nUsers table structure:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type}`);
      });
    } catch (e) {
      console.log('\n✗ Users table does not exist:', e.message);
    }
    
    await conn.end();
  } catch (err) {
    console.error('✗ Database error:', err.message);
    process.exit(1);
  }
}

testDB();
