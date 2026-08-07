const express = require('express');
const { salesProtect } = require('../middleware/adminAuth');
const { userProtect } = require('../middleware/userAuth');
const { razorpayWebhook, syncPaymentLinkStatus, syncMyPaymentStatus } = require('../controllers/paymentController');

const router = express.Router();

router.post(
  '/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  razorpayWebhook
);

router.get('/bookings/:id/payment-status', salesProtect, syncPaymentLinkStatus);
router.post('/bookings/:id/sync', userProtect, syncMyPaymentStatus);

module.exports = router;