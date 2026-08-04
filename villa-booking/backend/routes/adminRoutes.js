const express = require('express');
const { listBookings, updateBookingStatus, deleteBooking } = require('../controllers/adminBookingController');
const { deleteReview } = require('../controllers/adminReviewController');
const { getLanding, updateLanding, uploadCmsImage, deleteCmsImage } = require('../controllers/cmsController');
const { adminProtect } = require('../middleware/adminAuth');
const uploadMemory = require('../middleware/uploadMemory');

const router = express.Router();

router.use(adminProtect);

router.get('/cms', getLanding);
router.put('/cms', updateLanding);
router.post('/cms/upload', uploadMemory.single('image'), uploadCmsImage);
router.delete('/cms/image', deleteCmsImage);

router.get('/bookings', listBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.delete('/bookings/:id', deleteBooking);

router.delete('/reviews/:id', deleteReview);

module.exports = router;
