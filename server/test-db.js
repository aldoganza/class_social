const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('./src/lib/db');

async function testConnection() {
  console.log('Testing database connection with config:', {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    database: DB_CONFIG.database,
    usingPassword: !!DB_CONFIG.password
  });

  let connection;
  try {
    // Test connection without database first
    connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });
    
    console.log('✅ Successfully connected to MySQL server');
    
    // Check if database exists
    const [dbs] = await connection.query(
      `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [DB_CONFIG.database]
    );
    
    if (dbs.length === 0) {
      console.log(`❌ Database '${DB_CONFIG.database}' does not exist`);
      console.log(`Run this command to create it:`);
      console.log(`mysql -u ${DB_CONFIG.user} ${DB_CONFIG.password ? '-p' : ''} -e "CREATE DATABASE \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
    } else {
      console.log(`✅ Database '${DB_CONFIG.database}' exists`);
    }
    
    // Test connection with database
    await connection.end();
    connection = await mysql.createConnection(DB_CONFIG);
    await connection.ping();
    console.log('✅ Successfully connected to database');
    
    // Check tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [DB_CONFIG.database]
    );
    
    console.log(`\nFound ${tables.length} tables in database '${DB_CONFIG.database}':`);
    tables.forEach(table => console.log(`- ${table.TABLE_NAME}`));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`\nThe database '${DB_CONFIG.database}' doesn't exist. Please create it first.`);
      console.log(`You can create it by running this command:`);
      console.log(`mysql -u ${DB_CONFIG.user} ${DB_CONFIG.password ? '-p' : ''} -e "CREATE DATABASE \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nAccess denied. Please check your database credentials in .env file.');
      console.log('Current configuration:', {
        user: DB_CONFIG.user,
        usingPassword: DB_CONFIG.password ? 'yes' : 'no',
        host: DB_CONFIG.host,
        port: DB_CONFIG.port
      });
    }
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
}

testConnection();
