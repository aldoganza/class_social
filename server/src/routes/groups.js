const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../lib/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Configure multer for group images and files
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// POST /api/groups - Create a new group
router.post('/', authRequired, upload.single('group_pic'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    let group_pic = null;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      group_pic = `${baseUrl}/uploads/${req.file.filename}`;
    }

    // Create group
    const [result] = await pool.execute(
      'INSERT INTO groups_table (name, description, group_pic, created_by) VALUES (?, ?, ?, ?)',
      [name.trim(), description || null, group_pic, req.user.id]
    );

    const groupId = result.insertId;

    // Add creator as admin
    await pool.execute(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [groupId, req.user.id, 'admin']
    );

    // Fetch created group with member count
    const [[group]] = await pool.execute(
      `SELECT g.*, u.name as creator_name, u.profile_pic as creator_pic,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups_table g
       JOIN users u ON u.id = g.created_by
       WHERE g.id = ?`,
      [groupId]
    );

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/groups - Get all groups user is a member of
router.get('/', authRequired, async (req, res) => {
  try {
    const [groups] = await pool.execute(
      `SELECT g.*, u.name as creator_name, u.profile_pic as creator_pic,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        gm.role as my_role,
        (SELECT content FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message_time
       FROM groups_table g
       JOIN users u ON u.id = g.created_by
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
       ORDER BY g.updated_at DESC`,
      [req.user.id]
    );
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/groups/:id - Get group details
router.get('/:id', authRequired, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    
    // Check if user is a member
    const [[membership]] = await pool.execute(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const [[group]] = await pool.execute(
      `SELECT g.*, u.name as creator_name, u.profile_pic as creator_pic,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups_table g
       JOIN users u ON u.id = g.created_by
       WHERE g.id = ?`,
      [groupId]
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.my_role = membership.role;
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/groups/:id - Update group (admin only)
router.put('/:id', authRequired, upload.single('group_pic'), async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const { name, description } = req.body;

    // Check if user is admin
    const [[membership]] = await pool.execute(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let group_pic = undefined;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      group_pic = `${baseUrl}/uploads/${req.file.filename}`;
    }

    // Build update query
    const updates = [];
    const values = [];
    
    if (name && name.trim()) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (group_pic) {
      updates.push('group_pic = ?');
      values.push(group_pic);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(groupId);
    await pool.execute(
      `UPDATE groups_table SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated group
    const [[group]] = await pool.execute(
      `SELECT g.*, u.name as creator_name, u.profile_pic as creator_pic,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups_table g
       JOIN users u ON u.id = g.created_by
       WHERE g.id = ?`,
      [groupId]
    );

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/groups/:id - Delete group (admin only)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const groupId = Number(req.params.id);

    // Check if user is admin
    const [[membership]] = await pool.execute(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await pool.execute('DELETE FROM groups_table WHERE id = ?', [groupId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/groups/:id/members - Get group members
router.get('/:id/members', authRequired, async (req, res) => {
  try {
    const groupId = Number(req.params.id);

    // Check if user is a member
    const [[membership]] = await pool.execute(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const [members] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.profile_pic, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ?
       ORDER BY gm.role DESC, gm.joined_at ASC`,
      [groupId]
    );

    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups/:id/members - Add member to group (admin only)
router.post('/:id/members', authRequired, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check if requester is admin
    const [[membership]] = await pool.execute(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Add member
    try {
      await pool.execute(
        'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
        [groupId, user_id, 'member']
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'User is already a member' });
      }
      throw e;
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/groups/:id/members/:userId - Remove member (admin only or self)
router.delete('/:id/members/:userId', authRequired, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const userIdToRemove = Number(req.params.userId);

    // Check if requester is admin
    const [[membership]] = await pool.execute(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    // Allow if admin or removing self
    if (!membership || (membership.role !== 'admin' && req.user.id !== userIdToRemove)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Don't allow removing the creator
    const [[group]] = await pool.execute(
      'SELECT created_by FROM groups_table WHERE id = ?',
      [groupId]
    );

    if (group && group.created_by === userIdToRemove) {
      return res.status(400).json({ error: 'Cannot remove group creator' });
    }

    await pool.execute(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userIdToRemove]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/groups/:id/members/:userId/role - Change member role (admin only)
router.put('/:id/members/:userId/role', authRequired, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const userIdToUpdate = Number(req.params.userId);
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if requester is admin
    const [[membership]] = await pool.execute(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update role
    await pool.execute(
      'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
      [role, groupId, userIdToUpdate]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/groups/:id/messages - Get group messages
router.get('/:id/messages', authRequired, async (req, res) => {
  try {
    const groupId = Number(req.params.id);

    // Check if user is a member
    const [[membership]] = await pool.execute(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const [messages] = await pool.execute(
      `SELECT gm.*, u.name, u.profile_pic
       FROM group_messages gm
       JOIN users u ON u.id = gm.sender_id
       WHERE gm.group_id = ?
       ORDER BY gm.created_at ASC
       LIMIT 500`,
      [groupId]
    );

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups/:id/messages - Send message to group
router.post('/:id/messages', authRequired, upload.single('file'), async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const { content } = req.body;

    // Check if user is a member
    const [[membership]] = await pool.execute(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    let file_url = null;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      file_url = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const [result] = await pool.execute(
      'INSERT INTO group_messages (group_id, sender_id, content, file_url) VALUES (?, ?, ?, ?)',
      [groupId, req.user.id, content.trim(), file_url]
    );

    // Update group's updated_at
    await pool.execute('UPDATE groups_table SET updated_at = NOW() WHERE id = ?', [groupId]);

    const [[message]] = await pool.execute(
      `SELECT gm.*, u.name, u.profile_pic
       FROM group_messages gm
       JOIN users u ON u.id = gm.sender_id
       WHERE gm.id = ?`,
      [result.insertId]
    );

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
