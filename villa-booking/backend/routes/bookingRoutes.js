const express = require('express');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const { userProtect } = require('../middleware/userAuth');

const router = express.Router();

router.post('/', userProtect, createBooking);
router.get('/', userProtect, getUserBookings);
router.get('/:id', userProtect, getBookingById);
router.put('/:id/cancel', userProtect, cancelBooking);

module.exports = router;