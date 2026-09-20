const express = require('express');
const { createReview, getVillaReviews, deleteReview } = require('../controllers/reviewController');
const { userProtect } = require('../middleware/userAuth');
const { verifiedUserProtect } = require('../middleware/verifiedUserProtect');

const router = express.Router();

router.get('/villa/:villaId', getVillaReviews);
router.post('/villa/:villaId', userProtect, verifiedUserProtect, createReview);
router.delete('/:id', userProtect, deleteReview);

module.exports = router;
