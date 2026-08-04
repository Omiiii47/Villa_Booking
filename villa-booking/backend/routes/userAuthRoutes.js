const express = require('express');
const { register, login, getProfile, updateProfile, addToWishlist, getWishlist } = require('../controllers/userAuthController');
const { userProtect } = require('../middleware/userAuth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', userProtect, getProfile);
router.put('/profile', userProtect, updateProfile);
router.post('/wishlist/:villaId', userProtect, addToWishlist);
router.get('/wishlist', userProtect, getWishlist);

module.exports = router;
