const { pool } = require('./db')

async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      actor_id INT NOT NULL,
      type ENUM('follow','like','comment','group_added','group_admin','group_message') NOT NULL,
      post_id INT NULL,
      comment_id INT NULL,
      group_id INT NULL,
      message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      INDEX idx_user_read (user_id, read_at),
      INDEX idx_user_created (user_id, created_at),
      INDEX idx_group_notifications (group_id, type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  
  // Create table to track last read message per user per group
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS group_message_reads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      group_id INT NOT NULL,
      last_read_message_id INT NULL,
      last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_group (user_id, group_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE,
      INDEX idx_user_group (user_id, group_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

async function createNotification({ userId, actorId, type, postId=null, commentId=null, groupId=null, message=null }) {
  if (!userId || !actorId || !type) return
  if (Number(userId) === Number(actorId)) return // do not notify self actions
  await ensureTable()
  await pool.execute(
    'INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, group_id, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, actorId, type, postId, commentId, groupId, message]
  )
}

async function markGroupMessageAsRead(userId, groupId, messageId) {
  await ensureTable()
  await pool.execute(
    `INSERT INTO group_message_reads (user_id, group_id, last_read_message_id) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE 
     last_read_message_id = GREATEST(last_read_message_id, VALUES(last_read_message_id)),
     last_read_at = CURRENT_TIMESTAMP`,
    [userId, groupId, messageId]
  )
}

async function getGroupsWithUnreadMessages(userId) {
  await ensureTable()
  const [rows] = await pool.execute(`
    SELECT 
      g.id as group_id,
      g.name as group_name,
      CASE 
        WHEN gmr.last_read_message_id IS NULL THEN 1
        WHEN (SELECT COUNT(*) FROM group_messages gm WHERE gm.group_id = g.id AND gm.id > COALESCE(gmr.last_read_message_id, 0)) > 0 THEN 1
        ELSE 0
      END as has_unread
    FROM groups_table g
    JOIN group_members gm ON gm.group_id = g.id
    LEFT JOIN group_message_reads gmr ON gmr.user_id = ? AND gmr.group_id = g.id
    WHERE gm.user_id = ?
  `, [userId, userId])
  
  return rows.filter(row => row.has_unread === 1).map(row => row.group_id)
}

module.exports = { createNotification, ensureTable, markGroupMessageAsRead, getGroupsWithUnreadMessages }
