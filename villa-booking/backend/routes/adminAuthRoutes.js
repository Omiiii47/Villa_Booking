const express = require('express');
const { login, getMe } = require('../controllers/adminAuthController');
const { adminProtect } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', login);
router.get('/me', adminProtect, getMe);

module.exports = router;
