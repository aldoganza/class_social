// MySQL connection pool using mysql2/promise
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'classmates_social',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z'
};

const pool = mysql.createPool(DB_CONFIG);

async function ensureDatabaseAndSchema() {
  // Create DB if it doesn't exist using a connection without the database selected
  const { host, port, user, password, database } = DB_CONFIG;
  const admin = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  try {
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } finally {
    await admin.end();
  }

  // Apply schema and alter files
  const sqlDir = path.join(__dirname, '..', '..', 'sql');
  const files = ['schema.sql', 'alter_add_likes_comments.sql', 'alter_add_read_at.sql', 'alter_add_video_url.sql', 'alter_add_groups.sql'];
  for (const file of files) {
    const full = path.join(sqlDir, file);
    if (fs.existsSync(full)) {
      const sql = fs.readFileSync(full, 'utf8');
      if (sql && sql.trim()) {
        // Use a dedicated connection to run SQL with database selected
        const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
        try {
          // Split into individual statements to handle duplicate/exists errors gracefully
          const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
          for (const stmt of statements) {
            try {
              await conn.query(stmt);
            } catch (e) {
              const code = e && (e.code || e.errno);
              const msg = (e && e.message) || '';
              // Ignore duplicate column/index/table errors so re-running is idempotent
              const benign = (
                code === 'ER_DUP_FIELDNAME' ||
                code === 'ER_DUP_KEYNAME' ||
                code === 'ER_TABLE_EXISTS_ERROR' ||
                msg.includes('Duplicate column name') ||
                msg.includes('Duplicate key name') ||
                msg.includes('already exists')
              );
              if (!benign) throw e;
            }
          }
        } finally {
          await conn.end();
        }
      }
    }
  }
}

module.exports = { pool, ensureDatabaseAndSchema };
