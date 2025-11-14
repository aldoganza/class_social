const express = require('express')
const { pool } = require('../lib/db')
const { authRequired } = require('../middleware/auth')
const { ensureTable } = require('../lib/notifications')

const router = express.Router()

// Ensure the notifications table exists on first load
router.use(async (req, res, next) => {
  try { await ensureTable() } catch {} // best-effort
  next()
})

// GET /api/notifications - list recent notifications for current user
router.get('/', authRequired, async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50))
    const [rows] = await pool.query(
      `SELECT n.id, n.type, n.post_id, n.comment_id, n.group_id, n.message, n.created_at, n.read_at,
              a.id AS actor_id, a.name AS actor_name, a.profile_pic AS actor_pic,
              p.image_url AS post_image,
              g.name AS group_name, g.group_pic AS group_pic
         FROM notifications n
         JOIN users a ON a.id = n.actor_id
         LEFT JOIN posts p ON p.id = n.post_id
         LEFT JOIN groups_table g ON g.id = n.group_id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ?`,
      [req.user.id, limit]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/notifications/unread/count - number of unread notifications
router.get('/unread/count', authRequired, async (req, res) => {
  try {
    const [[row]] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL',
      [req.user.id]
    )
    res.json({ count: Number(row.count || 0) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/notifications/read - mark notifications as read (all or by ids)
router.post('/read', authRequired, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x) => Number(x)).map((x) => Number(x)) : []
    if (ids.length > 0) {
      // Only mark notifications that belong to the user
      const [result] = await pool.query(
        `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND id IN (${ids.map(()=>'?').join(',')}) AND read_at IS NULL`,
        [req.user.id, ...ids]
      )
      return res.json({ success: true, updated: result.affectedRows || 0 })
    } else {
      const [result] = await pool.query(
        'UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
        [req.user.id]
      )
      return res.json({ success: true, updated: result.affectedRows || 0 })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
