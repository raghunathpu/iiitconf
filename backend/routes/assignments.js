const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole, logAction } = require('../middleware/auth');

// GET /api/assignments/reviewers - Get available reviewers for a paper
router.get('/reviewers/:paperId', auth, requireRole('admin'), async (req, res) => {
  try {
    const paperId = req.params.paperId;
    const [paper] = await db.query('SELECT author_id FROM papers WHERE id=?', [paperId]);
    if (!paper.length) return res.status(404).json({ message: 'Paper not found.' });
    const authorId = paper[0].author_id;

    // Get reviewers not already assigned, not conflicted, not the author
    const [reviewers] = await db.query(
      `SELECT u.id, u.name, u.email, u.expertise_tags, u.institution,
              COUNT(a.id) as current_load
       FROM users u
       LEFT JOIN assignments a ON u.id=a.reviewer_id AND a.status != 'declined'
       WHERE u.role='reviewer' AND u.id != ? AND u.is_active=TRUE
       AND u.id NOT IN (SELECT reviewer_id FROM conflicts WHERE author_id=?)
       AND u.id NOT IN (SELECT reviewer_id FROM assignments WHERE paper_id=?)
       GROUP BY u.id
       ORDER BY current_load ASC`,
      [authorId, authorId, paperId]
    );
    res.json(reviewers);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/assignments - Assign reviewer to paper
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { paper_id, reviewer_id, deadline } = req.body;
    if (!paper_id || !reviewer_id) return res.status(400).json({ message: 'paper_id and reviewer_id required.' });

    // Check if already assigned
    const [existing] = await db.query('SELECT id FROM assignments WHERE paper_id=? AND reviewer_id=?', [paper_id, reviewer_id]);
    if (existing.length) return res.status(409).json({ message: 'Reviewer already assigned.' });

    // Check max 3 reviewers
    const [count] = await db.query('SELECT COUNT(*) as c FROM assignments WHERE paper_id=?', [paper_id]);
    if (count[0].c >= 3) return res.status(400).json({ message: 'Maximum 3 reviewers per paper.' });

    const [result] = await db.query(
      'INSERT INTO assignments (paper_id, reviewer_id, assigned_by, deadline) VALUES (?,?,?,?)',
      [paper_id, reviewer_id, req.user.id, deadline || null]
    );

    // Update paper status
    await db.query("UPDATE papers SET status='to_review' WHERE id=? AND status='under_assignment'", [paper_id]);

    // Notify reviewer
    const [paper] = await db.query('SELECT title FROM papers WHERE id=?', [paper_id]);
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type, related_paper_id) VALUES (?,?,?,?,?)',
      [reviewer_id, 'New Paper Assigned', `You have been assigned to review: "${paper[0].title}".${deadline ? ` Deadline: ${new Date(deadline).toLocaleDateString()}` : ''}`, 'info', paper_id]
    );

    await logAction(req.user.id, 'ASSIGN_REVIEWER', 'assignment', result.insertId, null, { paper_id, reviewer_id }, req.ip);

    res.status(201).json({ message: 'Reviewer assigned.', assignmentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/assignments/:id - Remove reviewer assignment
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const [assignment] = await db.query('SELECT * FROM assignments WHERE id=?', [req.params.id]);
    if (!assignment.length) return res.status(404).json({ message: 'Assignment not found.' });

    await db.query('DELETE FROM assignments WHERE id=?', [req.params.id]);

    await logAction(req.user.id, 'REMOVE_ASSIGNMENT', 'assignment', req.params.id, assignment[0], null, req.ip);
    res.json({ message: 'Assignment removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/assignments/:id/decline - Reviewer declines
router.put('/:id/decline', auth, requireRole('reviewer'), async (req, res) => {
  try {
    const [assignment] = await db.query('SELECT * FROM assignments WHERE id=? AND reviewer_id=?', [req.params.id, req.user.id]);
    if (!assignment.length) return res.status(404).json({ message: 'Assignment not found.' });

    await db.query("UPDATE assignments SET status='declined' WHERE id=?", [req.params.id]);

    // Notify admin
    const [paper] = await db.query('SELECT title FROM papers WHERE id=?', [assignment[0].paper_id]);
    const [admins] = await db.query("SELECT id FROM users WHERE role='admin'");
    for (const admin of admins) {
      await db.query('INSERT INTO notifications (user_id, title, message, type, related_paper_id) VALUES (?,?,?,?,?)',
        [admin.id, 'Reviewer Declined', `${req.user.name} declined review for "${paper[0].title}".`, 'warning', assignment[0].paper_id]);
    }

    res.json({ message: 'Assignment declined.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
