const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole, logAction } = require('../middleware/auth');

// GET /api/reviews/paper/:paperId - Get all reviews for a paper
router.get('/paper/:paperId', auth, async (req, res) => {
  try {
    const paperId = req.params.paperId;

    // Check access
    if (req.user.role === 'reviewer') {
      const [a] = await db.query('SELECT id FROM assignments WHERE paper_id=? AND reviewer_id=?', [paperId, req.user.id]);
      if (!a.length) return res.status(403).json({ message: 'Not assigned.' });
    }

    let query = `SELECT r.*, u.name as reviewer_name
                 FROM reviews r JOIN users u ON r.reviewer_id=u.id
                 WHERE r.paper_id=? AND r.is_submitted=TRUE`;
    const params = [paperId];

    // Reviewers can only see their own review or see others if allowed
    if (req.user.role === 'reviewer') {
      query = `SELECT r.*, u.name as reviewer_name
               FROM reviews r JOIN users u ON r.reviewer_id=u.id
               WHERE r.paper_id=? AND r.reviewer_id=?`;
      params.push(req.user.id);
    }

    const [reviews] = await db.query(query, params);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/reviews/my - Reviewer gets their own review for a paper
router.get('/my/:paperId', auth, requireRole('reviewer'), async (req, res) => {
  try {
    const [reviews] = await db.query(
      'SELECT * FROM reviews WHERE paper_id=? AND reviewer_id=?',
      [req.params.paperId, req.user.id]
    );
    res.json(reviews[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/reviews - Submit or save a review (reviewer)
router.post('/', auth, requireRole('reviewer'), async (req, res) => {
  try {
    const {
      paper_id, assignment_id,
      originality_score, technical_quality_score, relevance_score,
      clarity_score, presentation_score, confidence_score,
      recommendation, detailed_comments, private_comments, author_comments,
      is_submitted
    } = req.body;

    if (!paper_id) return res.status(400).json({ message: 'paper_id required.' });

    // Verify assignment
    const [assignment] = await db.query(
      'SELECT * FROM assignments WHERE paper_id=? AND reviewer_id=?',
      [paper_id, req.user.id]
    );
    if (!assignment.length) return res.status(403).json({ message: 'Not assigned to this paper.' });

    // Check deadline
    if (assignment[0].deadline && new Date() > new Date(assignment[0].deadline)) {
      return res.status(400).json({ message: 'Review deadline has passed.' });
    }

    // Calculate overall score
    const scores = [originality_score, technical_quality_score, relevance_score, clarity_score, presentation_score];
    const validScores = scores.filter(s => s !== undefined && s !== null);
    const overall = validScores.length ? (validScores.reduce((a, b) => a + Number(b), 0) / validScores.length).toFixed(2) : null;

    // Check if review exists
    const [existing] = await db.query('SELECT id FROM reviews WHERE paper_id=? AND reviewer_id=?', [paper_id, req.user.id]);

    if (existing.length) {
      // Update
      await db.query(
        `UPDATE reviews SET originality_score=?, technical_quality_score=?, relevance_score=?,
         clarity_score=?, presentation_score=?, confidence_score=?, overall_score=?,
         recommendation=?, detailed_comments=?, private_comments=?, author_comments=?,
         is_submitted=?, submitted_at=?
         WHERE paper_id=? AND reviewer_id=?`,
        [originality_score, technical_quality_score, relevance_score, clarity_score, presentation_score,
         confidence_score, overall, recommendation, detailed_comments, private_comments, author_comments,
         is_submitted || false, is_submitted ? new Date() : null,
         paper_id, req.user.id]
      );
    } else {
      await db.query(
        `INSERT INTO reviews (paper_id, reviewer_id, assignment_id, originality_score, technical_quality_score,
         relevance_score, clarity_score, presentation_score, confidence_score, overall_score,
         recommendation, detailed_comments, private_comments, author_comments, is_submitted, submitted_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [paper_id, req.user.id, assignment_id || null, originality_score, technical_quality_score,
         relevance_score, clarity_score, presentation_score, confidence_score, overall,
         recommendation, detailed_comments, private_comments, author_comments,
         is_submitted || false, is_submitted ? new Date() : null]
      );
    }

    // If submitted, update assignment status and paper status
    if (is_submitted) {
      await db.query("UPDATE assignments SET status='completed' WHERE paper_id=? AND reviewer_id=?", [paper_id, req.user.id]);

      // Check if all reviewers have submitted
      const [totalAssignments] = await db.query('SELECT COUNT(*) as total FROM assignments WHERE paper_id=?', [paper_id]);
      const [completedAssignments] = await db.query("SELECT COUNT(*) as done FROM assignments WHERE paper_id=? AND status='completed'", [paper_id]);

      if (completedAssignments[0].done === totalAssignments[0].total && totalAssignments[0].total > 0) {
        await db.query("UPDATE papers SET status='reviewed' WHERE id=?", [paper_id]);
      }

      // Notify admin
      const [paper] = await db.query('SELECT title, author_id FROM papers WHERE id=?', [paper_id]);
      const [admins] = await db.query("SELECT id FROM users WHERE role='admin'");
      for (const admin of admins) {
        await db.query('INSERT INTO notifications (user_id, title, message, type, related_paper_id) VALUES (?,?,?,?,?)',
          [admin.id, 'Review Submitted', `${req.user.name} submitted review for "${paper[0].title}".`, 'success', paper_id]);
      }

      await logAction(req.user.id, 'SUBMIT_REVIEW', 'review', paper_id, null, { recommendation }, req.ip);
    }

    res.json({ message: is_submitted ? 'Review submitted.' : 'Review saved as draft.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/reviews/comparison/:paperId - Admin compare all reviews
router.get('/comparison/:paperId', auth, requireRole('admin'), async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name as reviewer_name, u.expertise_tags
       FROM reviews r JOIN users u ON r.reviewer_id=u.id
       WHERE r.paper_id=? AND r.is_submitted=TRUE`,
      [req.params.paperId]
    );

    const [paper] = await db.query(
      'SELECT p.*, t.name as track_name FROM papers p LEFT JOIN tracks t ON p.track_id=t.id WHERE p.id=?',
      [req.params.paperId]
    );

    // Calculate aggregate stats
    let avgScore = 0, recommendations = {};
    if (reviews.length) {
      avgScore = reviews.reduce((a, r) => a + Number(r.overall_score || 0), 0) / reviews.length;
      reviews.forEach(r => {
        recommendations[r.recommendation] = (recommendations[r.recommendation] || 0) + 1;
      });
    }

    res.json({ paper: paper[0], reviews, aggregate: { avgScore: avgScore.toFixed(2), recommendations, totalReviews: reviews.length } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
