const express = require('express');
const { register, login, getProfile, updateProfile, addToWishlist, getWishlist } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/wishlist/:villaId', protect, addToWishlist);
router.get('/wishlist', protect, getWishlist);

module.exports = router;
