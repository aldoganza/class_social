const { pool } = require('./db')

async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      actor_id INT NOT NULL,
      type ENUM('follow','like','comment') NOT NULL,
      post_id INT NULL,
      comment_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      INDEX idx_user_read (user_id, read_at),
      INDEX idx_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

async function createNotification({ userId, actorId, type, postId=null, commentId=null }) {
  if (!userId || !actorId || !type) return
  if (Number(userId) === Number(actorId)) return // do not notify self actions
  await ensureTable()
  await pool.execute(
    'INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES (?, ?, ?, ?, ?)',
    [userId, actorId, type, postId, commentId]
  )
}

module.exports = { createNotification, ensureTable }
