/**
 * config/db.js
 * SQLite database connection + schema bootstrap
 * Uses better-sqlite3 (synchronous, no separate server needed)
 */

'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// DB_PATH env allows overriding the database location (useful when project lives
// on a filesystem that doesn't support SQLite journal files, e.g. NTFS via WSL).
// Default: ./data/apnashiksharth.db inside the project directory.
let DB_PATH;
if (process.env.DB_PATH) {
  DB_PATH = process.env.DB_PATH;
} else {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  DB_PATH = path.join(dataDir, 'apnashiksharth.db');
}

let db;

function getDb() {
  if (db) return db;

  db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? null : null });

  // Enable foreign keys (WAL skipped for cross-platform filesystem compat)
  db.pragma('foreign_keys = ON');

  bootstrapSchema(db);
  seedCourses(db);

  console.log('✅ SQLite connected:', DB_PATH);
  return db;
}

/* ------------------------------------------------------------------ */
/*  Schema                                                              */
/* ------------------------------------------------------------------ */
function bootstrapSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'student',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      slug         TEXT    NOT NULL UNIQUE,
      description  TEXT    NOT NULL,
      long_desc    TEXT,
      category     TEXT    NOT NULL,
      duration     TEXT    NOT NULL,
      price        INTEGER NOT NULL DEFAULT 0,
      price_orig   INTEGER NOT NULL DEFAULT 0,
      image_url    TEXT,
      badge        TEXT,
      instructor   TEXT    NOT NULL,
      rating       REAL    NOT NULL DEFAULT 4.5,
      reviews      INTEGER NOT NULL DEFAULT 0,
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at TEXT    NOT NULL DEFAULT (datetime('now')),
      progress    INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      phone      TEXT,
      subject    TEXT,
      message    TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

/* ------------------------------------------------------------------ */
/*  Seed demo courses                                                   */
/* ------------------------------------------------------------------ */
function seedCourses(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO courses (title, slug, description, long_desc, category, duration,
                         price, price_orig, image_url, badge, instructor, rating, reviews)
    VALUES (@title, @slug, @description, @long_desc, @category, @duration,
            @price, @price_orig, @image_url, @badge, @instructor, @rating, @reviews)
  `);

  const courses = [
    {
      title:       'Full Stack Web Development',
      slug:        'full-stack-web-development',
      description: 'Master HTML, CSS, JavaScript, React, Node.js and MongoDB to build production-grade web apps from scratch.',
      long_desc:   'This comprehensive course covers the complete modern web development stack. You will build real projects including an e-commerce app, a social platform, and a portfolio — all deployed to the cloud.',
      category:    'Tech',
      duration:    '6 Months',
      price:       4999,
      price_orig:  14999,
      image_url:   'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80',
      badge:       'Bestseller',
      instructor:  'Rajesh Kumar',
      rating:      4.9,
      reviews:     3241
    },
    {
      title:       'Data Science & Machine Learning',
      slug:        'data-science-machine-learning',
      description: 'Learn Python, Pandas, NumPy, Scikit-learn, TensorFlow and deploy ML models in real industry projects.',
      long_desc:   'Go from zero to industry-ready data scientist. You will cover statistical analysis, data wrangling, supervised/unsupervised learning, deep learning, and model deployment on cloud platforms.',
      category:    'Tech',
      duration:    '4 Months',
      price:       5499,
      price_orig:  17999,
      image_url:   'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&q=80',
      badge:       'Free Trial',
      instructor:  'Priya Sharma',
      rating:      4.8,
      reviews:     2876
    },
    {
      title:       'AI & Machine Learning Masterclass',
      slug:        'ai-machine-learning-masterclass',
      description: 'Deep dive into Artificial Intelligence, Neural Networks, NLP, Computer Vision and Generative AI with hands-on projects.',
      long_desc:   'The most comprehensive AI course on the platform. Build chatbots, image classifiers, recommendation systems, and LLM-powered applications. Taught by PhD researchers from IIT.',
      category:    'Tech',
      duration:    '5 Months',
      price:       6999,
      price_orig:  19999,
      image_url:   'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80',
      badge:       'New',
      instructor:  'Arjun Mehta',
      rating:      4.9,
      reviews:     1842
    },
    {
      title:       'UI/UX Design Mastery',
      slug:        'ui-ux-design-mastery',
      description: 'Learn Figma, design systems, user research, wireframing and prototyping to land a product design role.',
      long_desc:   'Design thinking to pixel-perfect implementation. You will master Figma, build 5 portfolio projects, conduct real user interviews, and learn the principles that make world-class digital products.',
      category:    'Design',
      duration:    '3 Months',
      price:       3999,
      price_orig:  11999,
      image_url:   'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80',
      badge:       null,
      instructor:  'Ananya Patel',
      rating:      4.7,
      reviews:     1548
    },
    {
      title:       'Digital Marketing Pro',
      slug:        'digital-marketing-pro',
      description: 'Master SEO, Google Ads, Meta Ads, email marketing, and analytics to grow any business online.',
      long_desc:   'Learn the full digital marketing funnel — from brand awareness to conversion. Includes real ad account access, live campaign management, and Google/Meta certification prep.',
      category:    'Business',
      duration:    '2 Months',
      price:       2999,
      price_orig:  8999,
      image_url:   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      badge:       'Trending',
      instructor:  'Vikram Singh',
      rating:      4.8,
      reviews:     2190
    },
    {
      title:       'JEE Main & Advanced Prep',
      slug:        'jee-main-advanced-prep',
      description: 'IIT alumni-led Physics, Chemistry and Maths preparation with daily sheets, mock tests, and doubt sessions.',
      long_desc:   'A focused 11-month program for serious JEE aspirants. Covers NCERT + advanced problems for each chapter. Includes 40+ full mock tests, video solutions, and weekly live doubt classes.',
      category:    'Exam Prep',
      duration:    '11 Months',
      price:       7999,
      price_orig:  24999,
      image_url:   'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=80',
      badge:       'Bestseller',
      instructor:  'Dr. Sanjay Mishra',
      rating:      4.9,
      reviews:     4102
    }
  ];

  const insertAll = db.transaction((courses) => {
    courses.forEach(c => insert.run(c));
  });

  insertAll(courses);
  console.log('✅ Demo courses seeded');
}

module.exports = { getDb };
