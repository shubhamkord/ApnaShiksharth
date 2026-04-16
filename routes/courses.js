/**
 * routes/courses.js
 * GET  /api/courses          — list all active courses
 * GET  /api/courses/:slug    — single course detail
 */

'use strict';

const express  = require('express');
const { getDb } = require('../config/db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  GET /api/courses                                                   */
/* ------------------------------------------------------------------ */
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const { category, search } = req.query;

    let sql    = 'SELECT * FROM courses WHERE is_active = 1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR instructor LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY reviews DESC';

    const courses = db.prepare(sql).all(...params);

    // If user is logged in, flag which ones they're enrolled in
    let enrolledIds = new Set();
    if (req.user) {
      const rows = db.prepare('SELECT course_id FROM enrollments WHERE user_id = ?').all(req.user.id);
      enrolledIds = new Set(rows.map(r => r.course_id));
    }

    const result = courses.map(c => ({
      ...c,
      enrolled: enrolledIds.has(c.id)
    }));

    return res.status(200).json({ success: true, courses: result });

  } catch (err) {
    console.error('Courses list error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/courses/:slug                                             */
/* ------------------------------------------------------------------ */
router.get('/:slug', optionalAuth, (req, res) => {
  try {
    const db     = getDb();
    const course = db.prepare('SELECT * FROM courses WHERE slug = ? AND is_active = 1').get(req.params.slug);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    let enrolled = false;
    if (req.user) {
      const row = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
      enrolled = !!row;
    }

    return res.status(200).json({ success: true, course: { ...course, enrolled } });

  } catch (err) {
    console.error('Course detail error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
