// Simple migration runner to apply SQL files using mysql2/promise
// It applies, in order:
// 1) sql/alter_add_read_at.sql
// 2) sql/alter_add_likes_comments.sql
// You can add more files to the list below as needed.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const files = [
    path.join(__dirname, '..', 'sql', 'alter_add_read_at.sql'),
    path.join(__dirname, '..', 'sql', 'alter_add_likes_comments.sql'),
  ];

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
    multipleStatements: true,
  };

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Connected to MySQL');

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.log(`Skip missing file: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(file, 'utf8');
      if (!sql.trim()) {
        console.log(`Skip empty file: ${file}`);
        continue;
      }
      console.log(`Applying: ${path.basename(file)}`);
      await conn.query(sql);
      console.log(`Applied: ${path.basename(file)}`);
    }

    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
