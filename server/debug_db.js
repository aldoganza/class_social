require('dotenv').config();
const mysql = require('mysql2/promise');

async function debug() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
  });

  const [[db]] = await conn.query('SELECT DATABASE() as db');
  console.log('Current database:', db.db);
  
  console.log('\nAttempting to create likes table...');
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_like (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created likes table');
  } catch (e) {
    console.log('✗ Error:', e.message);
  }
  
  const [tables] = await conn.query('SHOW TABLES');
  console.log('\nTables after creation:');
  tables.forEach(row => console.log(`  - ${Object.values(row)[0]}`));
  
  await conn.end();
}

debug();
