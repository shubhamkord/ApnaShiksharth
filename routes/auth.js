/**
 * routes/auth.js
 * POST /api/auth/signup
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me   (protected)
 */

'use strict';

const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const validator = require('validator');
const { getDb } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  Helper — issue JWT + set httpOnly cookie                           */
/* ------------------------------------------------------------------ */
function issueToken(res, user) {
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000   // 7 days in ms
  });

  return token;
}

/* ------------------------------------------------------------------ */
/*  POST /api/auth/signup                                              */
/* ------------------------------------------------------------------ */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const trimName  = name.trim();
    const trimEmail = email.trim().toLowerCase();

    if (trimName.length < 2 || trimName.length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be 2–60 characters.' });
    }

    if (!validator.isEmail(trimEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const db = getDb();

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Insert user
    const result = db.prepare(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
    ).run(trimName, trimEmail, hash);

    const newUser = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = issueToken(res, newUser);

    return res.status(201).json({
      success: true,
      message: `Welcome to Apna Shiksharth, ${newUser.name}! Account created successfully.`,
      user:    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      token    // also returned for clients that can't use cookies
    });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login                                               */
/* ------------------------------------------------------------------ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const trimEmail = email.trim().toLowerCase();

    if (!validator.isEmail(trimEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const db   = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimEmail);

    if (!user) {
      // Generic message — don't reveal whether email exists
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = issueToken(res, user);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user:    { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/logout                                              */
/* ------------------------------------------------------------------ */
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/* ------------------------------------------------------------------ */
/*  GET /api/auth/me  — returns current user (protected)              */
/* ------------------------------------------------------------------ */
router.get('/me', verifyToken, (req, res) => {
  try {
    const db   = getDb();
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Fetch enrolled courses
    const enrollments = db.prepare(`
      SELECT c.id, c.title, c.slug, c.category, c.duration, c.image_url, c.instructor,
             e.enrolled_at, e.progress
      FROM   enrollments e
      JOIN   courses c ON c.id = e.course_id
      WHERE  e.user_id = ?
      ORDER  BY e.enrolled_at DESC
    `).all(user.id);

    return res.status(200).json({
      success: true,
      user:    { ...user, enrollments }
    });

  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/enroll/:courseId — enroll in a course (protected)  */
/* ------------------------------------------------------------------ */
router.post('/enroll/:courseId', verifyToken, (req, res) => {
  try {
    const db       = getDb();
    const courseId = parseInt(req.params.courseId, 10);

    const course = db.prepare('SELECT id, title FROM courses WHERE id = ? AND is_active = 1').get(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    try {
      db.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)').run(req.user.id, courseId);
    } catch (e) {
      // UNIQUE constraint — already enrolled
      return res.status(409).json({ success: false, message: `You are already enrolled in "${course.title}".` });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully enrolled in "${course.title}"! Check your dashboard.`
    });

  } catch (err) {
    console.error('Enroll error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
