// Check MySQL data directory
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDataDir() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  try {
    const conn = await mysql.createConnection(config);
    
    // Get data directory
    const [rows] = await conn.query("SHOW VARIABLES LIKE 'datadir'");
    const datadir = rows[0].Value;
    console.log('MySQL data directory:', datadir);
    console.log('\nTo manually fix tablespace issues:');
    console.log(`1. Stop MySQL server`);
    console.log(`2. Navigate to: ${datadir}classmates_social/`);
    console.log(`3. Delete these files if they exist:`);
    console.log(`   - users.ibd`);
    console.log(`   - posts.ibd`);
    console.log(`   - follows.ibd`);
    console.log(`   - messages.ibd`);
    console.log(`4. Restart MySQL server`);
    console.log(`5. Run: node test_schema.js`);
    
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkDataDir();
