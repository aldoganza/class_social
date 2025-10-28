require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
    multipleStatements: true
  });

  const sqlFile = path.join(__dirname, 'sql', 'alter_add_likes_comments.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('Executing alter_add_likes_comments.sql...\n');
  
  const cleanedSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
    
  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`Found ${statements.length} statements:\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}] ${stmt.substring(0, 60)}...`);
    try {
      await conn.query(stmt);
      console.log('    ✓ Success\n');
    } catch (e) {
      console.log(`    ✗ Error: ${e.message}\n`);
    }
  }
  
  await conn.end();
}

test();
