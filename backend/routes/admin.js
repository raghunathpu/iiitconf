const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/admin/analytics - Dashboard stats
router.get('/analytics', auth, requireRole('admin'), async (req, res) => {
  try {
    const [[totalPapers]] = await db.query('SELECT COUNT(*) as count FROM papers');
    const [byStatus] = await db.query('SELECT status, COUNT(*) as count FROM papers GROUP BY status');
    const [byTrack] = await db.query(`SELECT t.name, COUNT(p.id) as count FROM papers p 
                                       LEFT JOIN tracks t ON p.track_id=t.id GROUP BY t.name`);
    const [reviewerLoad] = await db.query(`SELECT u.name, COUNT(a.id) as assigned, 
                                            SUM(CASE WHEN a.status='completed' THEN 1 ELSE 0 END) as completed
                                            FROM users u LEFT JOIN assignments a ON u.id=a.reviewer_id
                                            WHERE u.role='reviewer' GROUP BY u.id, u.name`);
    const [[pendingReviews]] = await db.query("SELECT COUNT(*) as count FROM assignments WHERE status='pending'");
    const [[totalReviews]] = await db.query('SELECT COUNT(*) as count FROM reviews WHERE is_submitted=TRUE');
    const [[avgScore]] = await db.query('SELECT AVG(overall_score) as avg FROM reviews WHERE is_submitted=TRUE');
    
    const [recentPapers] = await db.query(`
      SELECT p.id, p.title, p.status, p.submission_date, u.name as author_name
      FROM papers p JOIN users u ON p.author_id=u.id
      ORDER BY p.submission_date DESC LIMIT 5`);

    const [monthlySubmissions] = await db.query(`
      SELECT DATE_FORMAT(submission_date, '%Y-%m') as month, COUNT(*) as count 
      FROM papers GROUP BY month ORDER BY month DESC LIMIT 12`);

    const [recommendationDist] = await db.query(`
      SELECT recommendation, COUNT(*) as count FROM reviews 
      WHERE is_submitted=TRUE GROUP BY recommendation`);

    res.json({
      totalPapers: totalPapers.count,
      byStatus,
      byTrack,
      reviewerLoad,
      pendingReviews: pendingReviews.count,
      totalReviews: totalReviews.count,
      avgScore: avgScore.avg ? Number(avgScore.avg).toFixed(2) : 0,
      recentPapers,
      monthlySubmissions: monthlySubmissions.reverse(),
      recommendationDist
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/users - List all users
router.get('/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = 'SELECT id, name, email, role, institution, is_active, created_at, expertise_tags FROM users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role=?'; params.push(role); }
    if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const [users] = await db.query(query, params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/users/:id/toggle - Toggle user active status
router.put('/users/:id/toggle', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active=NOT is_active WHERE id=?', [req.params.id]);
    res.json({ message: 'User status toggled.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['author','reviewer','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    await db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
    res.json({ message: 'Role updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', auth, requireRole('admin'), async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT al.*, u.name as user_name FROM audit_logs al
      LEFT JOIN users u ON al.user_id=u.id
      ORDER BY al.created_at DESC LIMIT 100`);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/conflicts - Add conflict of interest
router.post('/conflicts', auth, requireRole('admin'), async (req, res) => {
  try {
    const { reviewer_id, author_id, reason } = req.body;
    await db.query('INSERT IGNORE INTO conflicts (reviewer_id, author_id, reason, created_by) VALUES (?,?,?,?)',
      [reviewer_id, author_id, reason, req.user.id]);
    res.json({ message: 'Conflict recorded.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/tracks
router.post('/tracks', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, deadline } = req.body;
    const [result] = await db.query('INSERT INTO tracks (name, description, deadline) VALUES (?,?,?)',
      [name, description, deadline || null]);
    res.status(201).json({ message: 'Track created.', trackId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
