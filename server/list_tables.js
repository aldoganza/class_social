require('dotenv').config();
const mysql = require('mysql2/promise');

async function list() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
  });

  const [tables] = await conn.query('SHOW TABLES');
  console.log('Tables in database:');
  tables.forEach(row => console.log(`  - ${Object.values(row)[0]}`));
  
  await conn.end();
}

list();
