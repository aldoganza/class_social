require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearAllData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
  });

  console.log('🗑️  Clearing all data from database...\n');

  try {
    // Disable foreign key checks temporarily
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Delete from all tables
    const tables = [
      'reels_saves',
      'reels_likes',
      'reels_comments',
      'reels',
      'stories_views',
      'stories_likes',
      'stories',
      'notifications',
      'comments',
      'likes',
      'group_messages',
      'group_members',
      'groups_table',
      'messages',
      'follows',
      'posts',
      'user_settings',
      'password_resets',
      'users'
    ];

    for (const table of tables) {
      try {
        const [result] = await conn.query(`DELETE FROM ${table}`);
        console.log(`✓ Cleared ${table}: ${result.affectedRows} rows deleted`);
      } catch (e) {
        console.log(`⚠️  ${table}: ${e.message}`);
      }
    }

    // Re-enable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ All data cleared successfully!');
    console.log('\nYou can now:');
    console.log('1. Go to http://localhost:5173/signup');
    console.log('2. Create a new account');
    console.log('3. Start using the site fresh!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await conn.end();
  }
}

clearAllData();
