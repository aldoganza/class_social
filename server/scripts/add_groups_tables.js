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
    
    // Execute the entire SQL at once
    console.log('Executing SQL migration...\n');
    
    try {
      await connection.query(sql);
      console.log('✓ groups_table created');
      console.log('✓ group_members created');
      console.log('✓ group_messages created');
    } catch (e) {
      const msg = (e && e.message) || '';
      if (msg.includes('already exists')) {
        console.log('  (Tables already exist)');
      } else {
        throw e;
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
