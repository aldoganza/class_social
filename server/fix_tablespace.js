// Fix orphaned tablespace issue
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixTablespace() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
    multipleStatements: true
  };

  console.log('Connecting to MySQL to fix tablespace issues...');
  
  try {
    const conn = await mysql.createConnection(config);
    
    // Try to forcefully drop tables with tablespace cleanup
    const tables = ['messages', 'follows', 'posts', 'users'];
    
    console.log('\nAttempting to clean up orphaned tablespaces...');
    
    for (const table of tables) {
      try {
        // First try to discard tablespace if table exists in a broken state
        await conn.query(`ALTER TABLE ${table} DISCARD TABLESPACE`);
        console.log(`  ✓ Discarded tablespace for ${table}`);
      } catch (e) {
        // Table might not exist or already discarded, that's fine
        console.log(`  - ${table}: ${e.message}`);
      }
      
      try {
        // Now drop the table
        await conn.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`  ✓ Dropped table ${table}`);
      } catch (e) {
        console.log(`  - Could not drop ${table}: ${e.message}`);
      }
    }
    
    console.log('\n✓ Tablespace cleanup completed');
    console.log('Now run: node test_schema.js');
    
    await conn.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

fixTablespace();
