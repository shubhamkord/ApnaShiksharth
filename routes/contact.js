/**
 * routes/contact.js
 * POST /api/contact  — validates, saves to DB, sends email
 */

'use strict';

const express    = require('express');
const nodemailer = require('nodemailer');
const validator  = require('validator');
const { getDb }  = require('../config/db');

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  SMTP Transporter (Hostinger-compatible)                            */
/* ------------------------------------------------------------------ */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.hostinger.com',
    port:   parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',   // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  return transporter;
}

/* ------------------------------------------------------------------ */
/*  Email template helpers                                             */
/* ------------------------------------------------------------------ */
function adminEmailHtml({ name, email, phone, subject, message }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header  { background: linear-gradient(135deg,#3B82F6 0%,#6366F1 100%); padding: 32px 36px; }
    .header h1 { color: #fff; margin: 0; font-size: 1.4rem; }
    .header p  { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 0.9rem; }
    .body    { padding: 32px 36px; }
    .field   { margin-bottom: 20px; }
    .label   { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
    .value   { font-size: 1rem; color: #1e293b; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #3B82F6; }
    .footer  { background: #f8fafc; padding: 20px 36px; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎓 New Contact Form Submission</h1>
      <p>Apna Shiksharth — ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Full Name</div>
        <div class="value">${escHtml(name)}</div>
      </div>
      <div class="field">
        <div class="label">Email Address</div>
        <div class="value">${escHtml(email)}</div>
      </div>
      ${phone ? `<div class="field"><div class="label">Phone</div><div class="value">${escHtml(phone)}</div></div>` : ''}
      ${subject ? `<div class="field"><div class="label">Subject</div><div class="value">${escHtml(subject)}</div></div>` : ''}
      <div class="field">
        <div class="label">Message</div>
        <div class="value" style="white-space:pre-wrap;">${escHtml(message)}</div>
      </div>
    </div>
    <div class="footer">
      Apna Shiksharth &bull; Indore, Madhya Pradesh, India &bull; support@apnashiksharth.com
    </div>
  </div>
</body>
</html>`;
}

function autoReplyHtml(name) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 580px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header  { background: linear-gradient(135deg,#3B82F6 0%,#6366F1 100%); padding: 40px 36px; text-align: center; }
    .logo    { font-size: 2.5rem; margin-bottom: 12px; }
    .header h1 { color: #fff; margin: 0; font-size: 1.5rem; }
    .header p  { color: rgba(255,255,255,0.85); margin: 8px 0 0; }
    .body    { padding: 36px 36px; color: #334155; line-height: 1.7; }
    .body h2 { color: #1e293b; font-size: 1.2rem; margin-top: 0; }
    .cta     { display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(135deg,#3B82F6,#6366F1); color: #fff; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 0.95rem; }
    .details { background: #f1f5f9; border-radius: 10px; padding: 20px 24px; margin-top: 20px; font-size: 0.9rem; }
    .details p { margin: 6px 0; }
    .footer  { background: #f8fafc; padding: 20px 36px; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">🎓</div>
      <h1>We've received your message!</h1>
      <p>Apna Shiksharth — India's Premier EdTech Platform</p>
    </div>
    <div class="body">
      <h2>Hello ${escHtml(name)},</h2>
      <p>
        Thank you for reaching out to <strong>Apna Shiksharth</strong>! We've received your message and
        our team will get back to you within <strong>24 hours</strong>.
      </p>
      <p>
        In the meantime, feel free to explore our courses and start your learning journey today!
      </p>
      <div style="text-align:center;">
        <a class="cta" href="https://apnashiksharth.com">Explore Courses</a>
      </div>
      <div class="details">
        <p>📞 <strong>Phone:</strong> +91 98064 28434</p>
        <p>📧 <strong>Email:</strong> support@apnashiksharth.com</p>
        <p>📍 <strong>Address:</strong> Indore, Madhya Pradesh, India</p>
      </div>
    </div>
    <div class="footer">
      © 2025 Apna Shiksharth Pvt. Ltd. &bull; Made with ❤️ in India 🇮🇳
    </div>
  </div>
</body>
</html>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------------ */
/*  POST /api/contact                                                  */
/* ------------------------------------------------------------------ */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    /* ---- Validation ---- */
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }

    const trimName    = String(name).trim();
    const trimEmail   = String(email).trim().toLowerCase();
    const trimPhone   = phone   ? String(phone).trim()   : '';
    const trimSubject = subject ? String(subject).trim() : '';
    const trimMessage = String(message).trim();

    if (trimName.length < 2 || trimName.length > 80) {
      return res.status(400).json({ success: false, message: 'Name must be 2–80 characters.' });
    }

    if (!validator.isEmail(trimEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (trimMessage.length < 10 || trimMessage.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message must be 10–2000 characters.' });
    }

    /* ---- Save to DB ---- */
    const db = getDb();
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '';

    db.prepare(`
      INSERT INTO contact_messages (name, email, phone, subject, message, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(trimName, trimEmail, trimPhone, trimSubject, trimMessage, ip);

    /* ---- Send emails (non-blocking) ---- */
    sendEmails({ name: trimName, email: trimEmail, phone: trimPhone, subject: trimSubject, message: trimMessage });

    return res.status(200).json({
      success: true,
      message: `Thank you, ${trimName}! Your message has been sent. We'll respond within 24 hours.`
    });

  } catch (err) {
    console.error('Contact error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

/* ------------------------------------------------------------------ */
/*  Email sending (fire-and-forget — never blocks the API response)   */
/* ------------------------------------------------------------------ */
async function sendEmails(data) {
  // Skip email in development if SMTP_USER is not configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('YOUR_')) {
    console.log('📧 [DEV] Email skipped — configure SMTP_USER in .env to enable.');
    console.log('   Contact from:', data.email, '|', data.name);
    return;
  }

  const transport = getTransporter();

  try {
    // Admin notification
    await transport.sendMail({
      from:    `"Apna Shiksharth" <${process.env.SMTP_USER}>`,
      to:      process.env.CONTACT_EMAIL_TO  || 'support@apnashiksharth.com',
      cc:      process.env.CONTACT_EMAIL_CC  || 'info@apnashiksharth.com',
      subject: `[Contact Form] ${data.subject || 'New message'} — ${data.name}`,
      html:    adminEmailHtml(data),
      text:    `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nMessage:\n${data.message}`
    });
    console.log('📧 Admin email sent to', process.env.CONTACT_EMAIL_TO);
  } catch (err) {
    console.error('❌ Admin email failed:', err.message);
  }

  try {
    // Auto-reply to sender
    await transport.sendMail({
      from:    `"Apna Shiksharth" <${process.env.SMTP_USER}>`,
      to:      data.email,
      subject: 'We received your message — Apna Shiksharth',
      html:    autoReplyHtml(data.name),
      text:    `Hi ${data.name},\n\nThank you for contacting Apna Shiksharth! We'll respond within 24 hours.\n\nPhone: +91 98064 28434\nEmail: support@apnashiksharth.com\nAddress: Indore, Madhya Pradesh, India`
    });
    console.log('📧 Auto-reply sent to', data.email);
  } catch (err) {
    console.error('❌ Auto-reply failed:', err.message);
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/contact/test-smtp  — test email config (dev only)        */
/* ------------------------------------------------------------------ */
router.get('/test-smtp', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production.' });
  }

  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('YOUR_')) {
    return res.status(200).json({
      success: false,
      message: 'SMTP not configured. Edit .env file and set SMTP_USER and SMTP_PASS.'
    });
  }

  try {
    await getTransporter().verify();
    return res.status(200).json({ success: true, message: 'SMTP connection verified successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: `SMTP error: ${err.message}` });
  }
});

module.exports = router;
