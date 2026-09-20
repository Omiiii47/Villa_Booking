const express = require('express');
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  getProfile,
  updateProfile,
  addToWishlist,
  getWishlist,
} = require('../controllers/userAuthController');
const { userProtect } = require('../middleware/userAuth');
const { authLimiter, emailLimiter } = require('../middleware/authLimiter');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Email verification + password reset (public, rate-limited).
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', emailLimiter, resendVerification);
router.post('/forgot-password', emailLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.use(userProtect);

router.get('/me', getMe);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/wishlist/:villaId', addToWishlist);
router.get('/wishlist', getWishlist);

module.exports = router;