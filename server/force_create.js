require('dotenv').config();
const mysql = require('mysql2/promise');

async function force() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
  });

  console.log('Creating likes table with explicit ENGINE...\n');
  
  try {
    const result = await conn.query(`
      CREATE TABLE likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_like (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Result:', result);
    console.log('✓ Table created');
  } catch (e) {
    console.log('✗ Error:', e.message);
    console.log('Code:', e.code);
    console.log('Errno:', e.errno);
  }
  
  const [tables] = await conn.query('SHOW TABLES');
  console.log('\nTables:');
  tables.forEach(row => console.log(`  - ${Object.values(row)[0]}`));
  
  await conn.end();
}

force();
