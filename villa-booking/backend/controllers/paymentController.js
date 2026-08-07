const Booking = require('../models/Booking');
const { verifyWebhookSignature, getPaymentLink, setupError } = require('../utils/razorpay');
const { addHistory, notifyAllSales } = require('../utils/bookingHistory');
const { notify } = require('../utils/notify');

const razorpayWebhook = async (req, res) => {
  const setupMsg = setupError();
  if (setupMsg) {
    return res.status(503).json({ message: `Payment integration unavailable: ${setupMsg}` });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  const signature = req.headers['x-razorpay-signature'];

  const valid = verifyWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET);
  if (!valid) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ message: 'Invalid webhook payload' });
  }

  try {
    const eventName = event.event || '';
    const linkEntity = event.payload && event.payload.payment_link && event.payload.payment_link.entity;
    const paymentEntity = event.payload && event.payload.payment && event.payload.payment.entity;

    if (eventName === 'payment_link.paid' || eventName === 'payment_link.partially_paid') {
      const linkId = linkEntity && linkEntity.id;
      const booking = await Booking.findOne({ paymentLinkId: linkId });
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found for payment link' });
      }

      booking.paymentStatus = 'PAID';
      booking.bookingStatus = 'CONFIRMED';
      booking.paymentId = (paymentEntity && paymentEntity.id) || linkEntity.id;
      booking.paymentDate = new Date();
      booking.amountPaid = paymentEntity && paymentEntity.amount ? paymentEntity.amount / 100 : booking.finalPrice || booking.quotedPrice;
      booking.paymentLink = '';
      booking.paymentLinkExpiresAt = null;

      if (booking.paymentHistory && booking.paymentHistory.length) {
        const last = booking.paymentHistory[booking.paymentHistory.length - 1];
        if (last && last.linkId === linkId) last.status = 'paid';
      }

      addHistory(booking, {
        actor: 'Razorpay',
        actorType: 'system',
        action: 'Payment received / Confirmed',
        note: `Webhook verified. Amount paid: $${booking.amountPaid}`,
        changes: { paymentStatus: 'PAID', bookingStatus: 'CONFIRMED', paymentId: booking.paymentId },
      });
      await booking.save();

      await notify({
        recipientType: 'user',
        recipient: booking.user,
        type: 'booking_confirmed',
        reference: booking._id,
        title: 'Payment successful — booking confirmed',
        message: `Payment of $${booking.amountPaid} received. Your villa booking is confirmed.`,
      });
      await notifyAllSales({
        type: 'payment_received',
        reference: booking._id,
        title: 'Payment received',
        message: `Customer paid $${booking.amountPaid} for their booking.`,
      });

      return res.status(200).json({ status: 'ok' });
    }

    if (eventName === 'payment_link.expired' || eventName === 'payment_link.cancelled') {
      const linkId = linkEntity && linkEntity.id;
      const booking = await Booking.findOne({ paymentLinkId: linkId });
      if (booking && booking.paymentStatus !== 'PAID') {
        booking.paymentStatus = 'LINK_EXPIRED';
        addHistory(booking, {
          actor: 'Razorpay',
          actorType: 'system',
          action: 'Payment link expired',
          note: eventName,
        });
        await booking.save();
      }
      return res.status(200).json({ status: 'ok' });
    }

    res.status(200).json({ status: 'ok', ignored: eventName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const syncBookingFromRazorpay = async (booking) => {
  if (!booking.paymentLinkId) return { booking, live: null };
  let live = null;
  try {
    live = await getPaymentLink(booking.paymentLinkId);
  } catch {
    live = null;
  }
  if (live) {
    const linkStatus = String(live.status || '').toLowerCase();
    if (linkStatus === 'paid' && booking.paymentStatus !== 'PAID') {
      booking.paymentStatus = 'PAID';
      booking.bookingStatus = 'CONFIRMED';
      booking.paymentDate = new Date();
      booking.amountPaid = live.amount ? live.amount / 100 : booking.amountPaid;
      booking.paymentId = booking.paymentId || live.id;
      booking.paymentLink = '';
      booking.paymentLinkExpiresAt = null;
      addHistory(booking, {
        actor: 'Razorpay',
        actorType: 'system',
        action: 'Payment received / Confirmed',
        note: `Link status synced. Amount paid: $${booking.amountPaid}`,
      });
      await booking.save();

      await notify({
        recipientType: 'user',
        recipient: booking.user,
        type: 'booking_confirmed',
        reference: booking._id,
        title: 'Payment successful — booking confirmed',
        message: `Payment of $${booking.amountPaid} received. Your villa booking is confirmed.`,
      });
      await notifyAllSales({
        type: 'payment_received',
        reference: booking._id,
        title: 'Payment received',
        message: `Customer paid $${booking.amountPaid} for their booking.`,
      });
    } else if ((linkStatus === 'expired' || linkStatus === 'cancelled') && booking.paymentStatus !== 'PAID') {
      booking.paymentStatus = 'LINK_EXPIRED';
      addHistory(booking, {
        action: 'Payment link expired',
        note: linkStatus,
      });
      await booking.save();
    }
  }
  return { booking, live };
};

const syncPaymentLinkStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const { live } = await syncBookingFromRazorpay(booking);
    res.json({ status: booking.paymentStatus, live: live ? live.status : null, booking: booking._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const syncMyPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await syncBookingFromRazorpay(booking);
    res.json({
      _id: booking._id,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      paid: booking.paymentStatus === 'PAID',
      paymentLink: booking.paymentLink || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { razorpayWebhook, syncPaymentLinkStatus, syncMyPaymentStatus };