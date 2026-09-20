const crypto = require('crypto');

// Generate a URL-safe, cryptographically random token.
const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

// Only the SHA-256 hash of a token is ever persisted. A DB leak cannot be
// used to mint valid links.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Constant-time comparison for token hashes.
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

module.exports = { generateToken, hashToken, safeEqual };