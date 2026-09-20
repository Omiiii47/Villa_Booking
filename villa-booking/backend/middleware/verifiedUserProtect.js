// Complements userProtect: the request must come from a user whose email has
// been verified. Applies only to transactional endpoints (booking/review
// creation) so existing pre-verification accounts and read-only flows keep
// working.
const verifiedUserProtect = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      message: 'Please verify your email address before doing this.',
    });
  }
  next();
};

module.exports = { verifiedUserProtect };