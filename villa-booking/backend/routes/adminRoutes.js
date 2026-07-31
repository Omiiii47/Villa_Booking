const express = require('express');
const { getSiteContent, updateSiteContent } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.use(protect, admin);

router.get('/site-content', getSiteContent);
router.put('/site-content', updateSiteContent);

module.exports = router;
