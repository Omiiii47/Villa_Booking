const express = require('express');
const { createReview, getVillaReviews, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/villa/:villaId', getVillaReviews);
router.post('/villa/:villaId', protect, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
