const express = require('express');
const { loginSales, getMe } = require('../controllers/adminAuthController');
const {
  listBookings,
  getBooking,
  updateBooking,
  approveBooking,
  rejectBooking,
  confirmPayment,
  cancelBooking,
  completeBooking,
  createCustomBooking,
  lookupUserByUsername,
  getDashboardStats,
  getMyNotifications,
  markNotificationsRead,
  createPaymentLink,
  getPaymentDetails,
  getPaymentHistory,
  clearPaymentLink,
} = require('../controllers/salesController');
const { salesProtect } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/auth/login', loginSales);

router.use(salesProtect);

router.get('/auth/me', getMe);
router.get('/stats', getDashboardStats);

router.get('/notifications', getMyNotifications);
router.put('/notifications/read', markNotificationsRead);

router.get('/bookings', listBookings);
router.get('/users/lookup', lookupUserByUsername);
router.get('/bookings/:id', getBooking);
router.post('/bookings', createCustomBooking);
router.put('/bookings/:id', updateBooking);
router.put('/bookings/:id/approve', approveBooking);
router.put('/bookings/:id/reject', rejectBooking);
router.put('/bookings/:id/confirm-payment', confirmPayment);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/bookings/:id/complete', completeBooking);
router.post('/bookings/:id/payment-link', createPaymentLink);
router.get('/bookings/:id/payment-details', getPaymentDetails);
router.get('/bookings/:id/payment-history', getPaymentHistory);
router.delete('/bookings/:id/payment-link', clearPaymentLink);

module.exports = router;