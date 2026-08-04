const express = require('express');
const { getLanding } = require('../controllers/cmsController');

const router = express.Router();

router.get('/landing', getLanding);

module.exports = router;
