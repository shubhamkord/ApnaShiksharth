/**
 * middleware/auth.js
 * JWT verification middleware — protects API routes
 */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * verifyToken
 * Reads JWT from httpOnly cookie OR Authorization header.
 * On success, attaches { id, name, email, role } to req.user
 */
function verifyToken(req, res, next) {
  // 1. Try cookie first (preferred — more secure)
  let token = req.cookies?.token;

  // 2. Fall back to Bearer token header
  if (!token) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id:    decoded.id,
      name:  decoded.name,
      email: decoded.email,
      role:  decoded.role
    };
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid session. Please log in again.';
    return res.status(401).json({ success: false, message: msg });
  }
}

/**
 * optionalAuth
 * Same as verifyToken but does not block the request if no token found.
 */
function optionalAuth(req, res, next) {
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
  }
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) { /* ignore */ }
  }
  next();
}

module.exports = { verifyToken, optionalAuth };
