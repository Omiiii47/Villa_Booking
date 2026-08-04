const express = require('express');
const { createReview, getVillaReviews, deleteReview } = require('../controllers/reviewController');
const { userProtect } = require('../middleware/userAuth');

const router = express.Router();

router.get('/villa/:villaId', getVillaReviews);
router.post('/villa/:villaId', userProtect, createReview);
router.delete('/:id', userProtect, deleteReview);

module.exports = router;
