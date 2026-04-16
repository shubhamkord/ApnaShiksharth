/**
 * server.js — Apna Shiksharth
 * Express backend for the EdTech platform
 */

'use strict';

require('dotenv').config();

const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');

/* ---- Routes ---- */
const authRoutes    = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const coursesRoutes = require('./routes/courses');

/* ---- Init DB on startup ---- */
const { getDb } = require('./config/db');
getDb();

/* ================================================================ */
const app  = express();
const PORT = process.env.PORT || 3000;

/* ================================================================
   SECURITY & MIDDLEWARE
================================================================ */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc:      ["'self'", "data:", "https:", "http:"],
      connectSrc:  ["'self'"],
    }
  }
}));

app.use(cors({
  origin:      process.env.NODE_ENV === 'production' ? 'https://apnashiksharth.com' : true,
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

/* ================================================================
   RATE LIMITING
================================================================ */
// Auth routes — strict
app.use('/api/auth/login',  rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' } }));
app.use('/api/auth/signup', rateLimit({ windowMs: 60 * 60 * 1000, max: 5,   message: { success: false, message: 'Too many accounts created. Try again in 1 hour.' } }));

// Contact — moderate
app.use('/api/contact', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Too many submissions. Try again in 1 hour.' } }));

// General API
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

/* ================================================================
   SERVE STATIC FILES
================================================================ */
app.use(express.static(path.join(__dirname), {
  index: false,         // we handle / manually
  extensions: ['html']
}));

/* ================================================================
   API ROUTES
================================================================ */
app.use('/api/auth',    authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/courses', coursesRoutes);

/* ================================================================
   PAGE ROUTES — serve HTML files
================================================================ */
const pages = {
  '/':           'index.html',
  '/login':      'pages/login.html',
  '/signup':     'pages/signup.html',
  '/dashboard':  'pages/dashboard.html',
  '/courses':    'pages/courses.html',
  '/contact':    'pages/contact.html',
  '/about':      'pages/about.html',
  '/terms':      'pages/terms.html',
  '/privacy':    'pages/privacy.html'
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

/* ================================================================
   HEALTH CHECK
================================================================ */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status:  'ok',
    app:     'Apna Shiksharth',
    env:     process.env.NODE_ENV || 'development',
    time:    new Date().toISOString()
  });
});

/* ================================================================
   404 HANDLER
================================================================ */
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `API route ${req.method} ${req.path} not found.` });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ================================================================
   GLOBAL ERROR HANDLER
================================================================ */
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

/* ================================================================
   START
================================================================ */
app.listen(PORT, () => {
  console.log('');
  console.log('  🎓  ╔══════════════════════════════════════╗');
  console.log('       ║      APNA SHIKSHARTH SERVER          ║');
  console.log('       ╚══════════════════════════════════════╝');
  console.log(`       ► Local:   http://localhost:${PORT}`);
  console.log(`       ► Env:     ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

module.exports = app;
