const express = require('express');
const { getSiteContent } = require('../controllers/adminController');

const router = express.Router();

router.get('/', getSiteContent);

module.exports = router;
