const express = require('express');
const { loginSales, getMe } = require('../controllers/adminAuthController');
const {
  listBookings,
  getBooking,
  updateBooking,
  reviewBooking,
  createCustomBooking,
} = require('../controllers/salesController');
const { salesProtect } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/auth/login', loginSales);

router.use(salesProtect);

router.get('/auth/me', getMe);
router.get('/bookings', listBookings);
router.get('/bookings/:id', getBooking);
router.post('/bookings', createCustomBooking);
router.put('/bookings/:id', updateBooking);
router.put('/bookings/:id/review', reviewBooking);

module.exports = router;