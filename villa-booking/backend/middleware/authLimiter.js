const rateLimit = require('express-rate-limit');

// Generic protection for auth endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

// Stricter limits for public email-triggering endpoints (forgot/resend) to
// prevent email-sending abuse / account enumeration via timing differences.
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in an hour.' },
});

module.exports = { authLimiter, emailLimiter };