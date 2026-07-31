const express = require('express');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/', protect, getUserBookings);
router.get('/all', protect, admin, getAllBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/status', protect, admin, updateBookingStatus);

module.exports = router;
