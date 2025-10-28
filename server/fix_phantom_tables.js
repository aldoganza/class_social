require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classmates_social',
  });

  const phantomTables = ['likes', 'comments', 'notifications', 'stories', 'stories_likes', 'stories_views', 'user_settings', 'reels', 'reels_comments', 'reels_likes', 'reels_saves'];
  
  console.log('Dropping phantom tables...\n');
  
  for (const table of phantomTables) {
    try {
      await conn.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`✓ Dropped ${table}`);
    } catch (e) {
      console.log(`✗ ${table}: ${e.message}`);
    }
  }
  
  console.log('\nRecreating tables...\n');
  
  // Likes
  try {
    await conn.query(`
      CREATE TABLE likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_like (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created likes');
  } catch (e) {
    console.log(`✗ likes: ${e.message}`);
  }
  
  // Comments
  try {
    await conn.query(`
      CREATE TABLE comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created comments');
  } catch (e) {
    console.log(`✗ comments: ${e.message}`);
  }
  
  // Notifications
  try {
    await conn.query(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        actor_id INT NOT NULL,
        type ENUM('follow','like','comment') NOT NULL,
        post_id INT NULL,
        comment_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME NULL,
        INDEX idx_user_read (user_id, read_at),
        INDEX idx_user_created (user_id, created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created notifications');
  } catch (e) {
    console.log(`✗ notifications: ${e.message}`);
  }
  
  // Stories
  try {
    await conn.query(`
      CREATE TABLE stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        media_url VARCHAR(255) NOT NULL,
        media_type ENUM('image','video') DEFAULT 'image',
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        INDEX idx_user (user_id),
        INDEX idx_expires (expires_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created stories');
  } catch (e) {
    console.log(`✗ stories: ${e.message}`);
  }
  
  // Stories likes
  try {
    await conn.query(`
      CREATE TABLE stories_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        story_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_story_like (story_id, user_id),
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created stories_likes');
  } catch (e) {
    console.log(`✗ stories_likes: ${e.message}`);
  }
  
  // Stories views
  try {
    await conn.query(`
      CREATE TABLE stories_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        story_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_story_view (story_id, user_id),
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created stories_views');
  } catch (e) {
    console.log(`✗ stories_views: ${e.message}`);
  }
  
  // User settings
  try {
    await conn.query(`
      CREATE TABLE user_settings (
        user_id INT PRIMARY KEY,
        privacy_private TINYINT(1) DEFAULT 0,
        messages_followers_only TINYINT(1) DEFAULT 0,
        email_notifications TINYINT(1) DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created user_settings');
  } catch (e) {
    console.log(`✗ user_settings: ${e.message}`);
  }
  
  // Reels
  try {
    await conn.query(`
      CREATE TABLE reels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        video_url VARCHAR(255) NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created reels');
  } catch (e) {
    console.log(`✗ reels: ${e.message}`);
  }
  
  // Reels comments
  try {
    await conn.query(`
      CREATE TABLE reels_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reel_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created reels_comments');
  } catch (e) {
    console.log(`✗ reels_comments: ${e.message}`);
  }
  
  // Reels likes
  try {
    await conn.query(`
      CREATE TABLE reels_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reel_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_reel_like (reel_id, user_id),
        FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created reels_likes');
  } catch (e) {
    console.log(`✗ reels_likes: ${e.message}`);
  }
  
  // Reels saves
  try {
    await conn.query(`
      CREATE TABLE reels_saves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reel_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_reel_save (reel_id, user_id),
        FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created reels_saves');
  } catch (e) {
    console.log(`✗ reels_saves: ${e.message}`);
  }
  
  const [tables] = await conn.query('SHOW TABLES');
  console.log('\nFinal table list:');
  tables.forEach(row => console.log(`  - ${Object.values(row)[0]}`));
  
  await conn.end();
  console.log('\n✓ Done! Restart the server.');
}

fix();
