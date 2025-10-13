// Script to manually add groups tables
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'classmates_social',
  multipleStatements: true
};

async function addGroupsTables() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'sql', 'alter_add_groups.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`\nExecuting ${statements.length} SQL statements...\n`);
    
    for (const stmt of statements) {
      try {
        await connection.query(stmt);
        // Extract table/action name for better logging
        const match = stmt.match(/CREATE TABLE.*?`?(\w+)`?/i) || 
                     stmt.match(/CREATE INDEX.*?ON (\w+)/i);
        if (match) {
          console.log(`✓ ${match[0].includes('INDEX') ? 'Index' : 'Table'}: ${match[1]}`);
        }
      } catch (e) {
        const code = e && (e.code || e.errno);
        const msg = (e && e.message) || '';
        // Ignore duplicate errors
        const benign = (
          code === 'ER_TABLE_EXISTS_ERROR' ||
          code === 'ER_DUP_KEYNAME' ||
          msg.includes('already exists')
        );
        if (benign) {
          const match = stmt.match(/CREATE TABLE.*?`?(\w+)`?/i);
          if (match) console.log(`  (${match[1]} already exists)`);
        } else {
          throw e;
        }
      }
    }
    
    // Show created tables
    console.log('\n✅ Groups tables created successfully!\n');
    console.log('Verifying tables...\n');
    
    const [tables] = await connection.query("SHOW TABLES LIKE '%group%'");
    console.table(tables);
    
    // Show structure of groups_table
    console.log('\ngroups_table structure:');
    const [structure] = await connection.query('DESCRIBE groups_table');
    console.table(structure);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) console.error('SQL:', error.sql);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

addGroupsTables();
