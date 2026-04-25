const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// POST /api/auth/send-register-otp
router.post('/send-register-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

    await db.query(
      'INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, 'register', expiresAt]
    );

    await sendEmail(email, 'IIITCONF Registration OTP', `Your registration OTP is ${otp}. It expires in 10 minutes.`);

    res.json({ message: 'Registration OTP sent successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, institution, expertise_tags, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password, and OTP are required.' });
    }

    const allowedRoles = ['author', 'reviewer'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Choose author or reviewer.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const [otpRecords] = await db.query(
      'SELECT id, expires_at FROM otps WHERE email = ? AND otp = ? AND type = "register" ORDER BY id DESC LIMIT 1',
      [email, otp]
    );

    if (!otpRecords.length) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    if (new Date(otpRecords[0].expires_at) < new Date()) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    // Delete OTP after successful verification
    await db.query('DELETE FROM otps WHERE email = ? AND type = "register"', [email]);

    const hashed = await bcrypt.hash(password, 10);
    const tags = expertise_tags ? JSON.stringify(expertise_tags) : null;

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, institution, expertise_tags) VALUES (?,?,?,?,?,?)',
      [name, email, hashed, role || 'author', institution || null, tags]
    );

    const token = jwt.sign({ id: result.insertId, role: role || 'author' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: result.insertId, name, email, role: role || 'author' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, institution: user.institution }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (!existing.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);

    await db.query(
      'INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, 'forgot_password', expiresAt]
    );

    await sendEmail(email, 'IIITCONF Password Reset OTP', `Your password reset OTP is ${otp}. It expires in 10 minutes.`);

    res.json({ message: 'Password reset OTP sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    const [otpRecords] = await db.query(
      'SELECT id, expires_at FROM otps WHERE email = ? AND otp = ? AND type = "forgot_password" ORDER BY id DESC LIMIT 1',
      [email, otp]
    );

    if (!otpRecords.length) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    if (new Date(otpRecords[0].expires_at) < new Date()) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    await db.query('DELETE FROM otps WHERE email = ? AND type = "forgot_password"', [email]);

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, institution, bio, expertise_tags, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, institution, bio, expertise_tags } = req.body;
    const tags = expertise_tags ? JSON.stringify(expertise_tags) : null;
    await db.query(
      'UPDATE users SET name=?, institution=?, bio=?, expertise_tags=? WHERE id=?',
      [name, institution, bio, tags, req.user.id]
    );
    res.json({ message: 'Profile updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
