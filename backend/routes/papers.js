const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { auth, requireRole, logAction } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/papers - Submit a paper (author)
router.post('/', auth, requireRole('author'), upload.single('pdf'), async (req, res) => {
  try {
    const { title, abstract, keywords, track_id } = req.body;
    if (!title || !abstract) return res.status(400).json({ message: 'Title and abstract required.' });
    if (!req.file) return res.status(400).json({ message: 'PDF file is required.' });

    const [result] = await db.query(
      'INSERT INTO papers (title, abstract, keywords, track_id, author_id, file_path, file_name, status) VALUES (?,?,?,?,?,?,?,?)',
      [title, abstract, keywords, track_id || null, req.user.id, req.file.path, req.file.originalname, 'submitted']
    );

    // Save file version
    await db.query(
      'INSERT INTO paper_files (paper_id, file_path, file_name, version) VALUES (?,?,?,?)',
      [result.insertId, req.file.path, req.file.originalname, 1]
    );

    // Notify admin(s)
    const [admins] = await db.query("SELECT id FROM users WHERE role='admin'");
    for (const admin of admins) {
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type, related_paper_id) VALUES (?,?,?,?,?)',
        [admin.id, 'New Paper Submitted', `"${title}" has been submitted by ${req.user.name}.`, 'info', result.insertId]
      );
    }

    await logAction(req.user.id, 'SUBMIT_PAPER', 'paper', result.insertId, null, { title }, req.ip);

    res.status(201).json({ message: 'Paper submitted successfully.', paperId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/papers - Get papers (role-based)
router.get('/', auth, async (req, res) => {
  try {
    let query, params = [];
    const { status, track_id, search } = req.query;

    if (req.user.role === 'author') {
      query = `SELECT p.*, t.name as track_name, u.name as author_name
               FROM papers p LEFT JOIN tracks t ON p.track_id=t.id
               LEFT JOIN users u ON p.author_id=u.id
               WHERE p.author_id=?`;
      params.push(req.user.id);
    } else if (req.user.role === 'reviewer') {
      query = `SELECT p.*, t.name as track_name, u.name as author_name, a.status as assignment_status, a.deadline as review_deadline
               FROM papers p
               JOIN assignments a ON p.id=a.paper_id
               LEFT JOIN tracks t ON p.track_id=t.id
               LEFT JOIN users u ON p.author_id=u.id
               WHERE a.reviewer_id=?`;
      params.push(req.user.id);
    } else {
      // admin sees all
      query = `SELECT p.*, t.name as track_name, u.name as author_name
               FROM papers p LEFT JOIN tracks t ON p.track_id=t.id
               LEFT JOIN users u ON p.author_id=u.id WHERE 1=1`;
    }

    if (status) { query += ' AND p.status=?'; params.push(status); }
    if (track_id) { query += ' AND p.track_id=?'; params.push(track_id); }
    if (search) { query += ' AND (p.title LIKE ? OR p.abstract LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY p.submission_date DESC';

    const [papers] = await db.query(query, params);
    res.json(papers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/papers/:id - Get single paper
router.get('/:id', auth, async (req, res) => {
  try {
    const [papers] = await db.query(
      `SELECT p.*, t.name as track_name, u.name as author_name, u.email as author_email, u.institution as author_institution
       FROM papers p LEFT JOIN tracks t ON p.track_id=t.id
       LEFT JOIN users u ON p.author_id=u.id WHERE p.id=?`,
      [req.params.id]
    );
    if (!papers.length) return res.status(404).json({ message: 'Paper not found.' });

    const paper = papers[0];

    // Authors can only see their own
    if (req.user.role === 'author' && paper.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Reviewers only if assigned
    if (req.user.role === 'reviewer') {
      const [assignment] = await db.query(
        'SELECT id FROM assignments WHERE paper_id=? AND reviewer_id=?',
        [req.params.id, req.user.id]
      );
      if (!assignment.length) return res.status(403).json({ message: 'Not assigned to this paper.' });
    }

    // Get assignments/reviewers
    const [assignments] = await db.query(
      `SELECT a.*, u.name as reviewer_name, u.email as reviewer_email, u.expertise_tags
       FROM assignments a JOIN users u ON a.reviewer_id=u.id WHERE a.paper_id=?`,
      [req.params.id]
    );

    // Get revision requests
    const [revisions] = await db.query(
      'SELECT * FROM revision_requests WHERE paper_id=? ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ ...paper, assignments, revisions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/papers/:id/download - Download PDF
router.get('/:id/download', auth, async (req, res) => {
  try {
    const [papers] = await db.query('SELECT * FROM papers WHERE id=?', [req.params.id]);
    if (!papers.length) return res.status(404).json({ message: 'Paper not found.' });
    const paper = papers[0];

    if (req.user.role === 'author' && paper.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (!fs.existsSync(paper.file_path)) {
      return res.status(404).json({ message: 'File not found on server.' });
    }

    res.download(paper.file_path, paper.file_name || 'paper.pdf');
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/papers/:id/status - Admin updates status
router.put('/:id/status', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['submitted','under_assignment','to_review','reviewed','revision','accepted','rejected','archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const [old] = await db.query('SELECT * FROM papers WHERE id=?', [req.params.id]);
    if (!old.length) return res.status(404).json({ message: 'Paper not found.' });

    await db.query('UPDATE papers SET status=?, admin_notes=? WHERE id=?', [status, admin_notes || null, req.params.id]);

    // Notify author
    const paper = old[0];
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type, related_paper_id) VALUES (?,?,?,?,?)',
      [paper.author_id, `Paper Status Updated`, `Your paper "${paper.title}" status changed to: ${status.replace('_',' ')}.`, 
       status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'info', req.params.id]
    );

    await logAction(req.user.id, 'UPDATE_STATUS', 'paper', req.params.id, { status: paper.status }, { status }, req.ip);
    res.json({ message: 'Status updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/papers/:id/revise - Author resubmits revised paper
router.post('/:id/revise', auth, requireRole('author'), upload.single('pdf'), async (req, res) => {
  try {
    const [papers] = await db.query('SELECT * FROM papers WHERE id=? AND author_id=?', [req.params.id, req.user.id]);
    if (!papers.length) return res.status(404).json({ message: 'Paper not found.' });
    if (!req.file) return res.status(400).json({ message: 'PDF required.' });

    const [versionResult] = await db.query('SELECT MAX(version) as maxV FROM paper_files WHERE paper_id=?', [req.params.id]);
    const newVersion = (versionResult[0].maxV || 0) + 1;

    await db.query('UPDATE papers SET file_path=?, file_name=?, status=? WHERE id=?',
      [req.file.path, req.file.originalname, 'to_review', req.params.id]);
    await db.query('INSERT INTO paper_files (paper_id, file_path, file_name, version) VALUES (?,?,?,?)',
      [req.params.id, req.file.path, req.file.originalname, newVersion]);

    // Update revision request
    await db.query("UPDATE revision_requests SET status='submitted' WHERE paper_id=? AND status='pending'", [req.params.id]);

    // Notify admin
    const [admins] = await db.query("SELECT id FROM users WHERE role='admin'");
    for (const admin of admins) {
      await db.query('INSERT INTO notifications (user_id, title, message, type, related_paper_id) VALUES (?,?,?,?,?)',
        [admin.id, 'Revised Paper Submitted', `Author resubmitted "${papers[0].title}" (v${newVersion}).`, 'info', req.params.id]);
    }

    res.json({ message: 'Revised paper submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/papers/:id/revision-request - Admin requests revision
router.post('/:id/revision-request', auth, requireRole('admin'), async (req, res) => {
  try {
    const { request_type, instructions, deadline } = req.body;
    const [papers] = await db.query('SELECT * FROM papers WHERE id=?', [req.params.id]);
    if (!papers.length) return res.status(404).json({ message: 'Paper not found.' });

    await db.query(
      'INSERT INTO revision_requests (paper_id, requested_by, request_type, instructions, deadline) VALUES (?,?,?,?,?)',
      [req.params.id, req.user.id, request_type || 'minor', instructions, deadline || null]
    );

    await db.query("UPDATE papers SET status='revision' WHERE id=?", [req.params.id]);

    await db.query('INSERT INTO notifications (user_id, title, message, type, related_paper_id) VALUES (?,?,?,?,?)',
      [papers[0].author_id, 'Revision Requested', `Your paper "${papers[0].title}" requires revision. ${instructions || ''}`, 'warning', req.params.id]);

    res.json({ message: 'Revision requested.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/papers/tracks/all
router.get('/tracks/all', auth, async (req, res) => {
  try {
    const [tracks] = await db.query('SELECT * FROM tracks ORDER BY name');
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
