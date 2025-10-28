require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
  });

  const tables = ['users', 'posts', 'likes', 'comments', 'notifications', 'stories', 'reels'];
  
  for (const table of tables) {
    try {
      await conn.query(`SELECT 1 FROM ${table} LIMIT 1`);
      console.log(`✓ ${table}`);
    } catch (e) {
      console.log(`✗ ${table}: ${e.message}`);
    }
  }
  
  await conn.end();
}

check();
