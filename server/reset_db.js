require('dotenv').config();
const mysql = require('mysql2/promise');

async function reset() {
  const dbName = process.env.DB_NAME || 'classmates_social';
  
  // Connect without database selected
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log(`Dropping database: ${dbName}`);
  await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  
  console.log(`Creating database: ${dbName}`);
  await conn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  
  await conn.end();
  
  console.log('\n✓ Database reset complete');
  console.log('Now run: node run_migrations.js');
}

reset().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
