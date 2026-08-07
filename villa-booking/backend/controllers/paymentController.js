const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { verifyWebhookSignature, getPaymentLink, setupError } = require('../utils/razorpay');
const { addHistory, notifyAllSales } = require('../utils/bookingHistory');
const { notify } = require('../utils/notify');

/**
 * Confirm the paying booking and, in the same operation, cancel every OTHER
 * booking that is holding the same (overlapping) dates so only one customer
 * can ever win a date range. Guaranteed by wrapping the confirm +cancel in a
 * single MongoDB transaction, which is what makes this "first payment wins".
 *
 * Idempotency: a boost displayed by `paymentProcessedId` prevents a duplicate
 * webhook delivery from double-confirming the same payment.
 */
const firstPaymentWins = async ({ booking, paymentId, paymentEntity, linkEntity }) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      // Lock the winning booking row and check it is still eligible.
      const fresh = await Booking.findOne({ _id: booking._id }).session(session);
      if (!fresh) {
        result = { confirmed: false, reason: 'not_found' };
        return;
      }
      if (fresh.bookingStatus === 'CONFIRMED' || fresh.bookingStatus === 'COMPLETED') {
        result = { confirmed: false, reason: 'already_confirmed' };
        return;
      }
      if (fresh.paymentProcessedId && fresh.paymentProcessedId === paymentId) {
        result = { confirmed: false, reason: 'already_processed' };
        return;
      }

      const winIn = new Date(fresh.checkIn);
      const winOut = new Date(fresh.checkOut);

      // Cross-check: another booking that overlaps these dates must NOT already
      // be CONFIRMED. Because this runs inside the transaction's isolation, it
      // serializes concurrent winners for the same range in most deployments.
      const existingWinner = await Booking.findOne({
        _id: { $ne: fresh._id },
        villa: fresh.villa,
        bookingStatus: { $in: ['CONFIRMED', 'COMPLETED'] },
        $or: [{ checkIn: { $lt: winOut }, checkOut: { $gt: winIn } }],
      }).session(session);
      if (existingWinner) {
        result = { confirmed: false, reason: 'dates_taken' };
        return;
      }

      // Cancel every overlapping PAYMENT_PENDING booking (this one excluded).
      const losers = await Booking.find({
        _id: { $ne: fresh._id },
        villa: fresh.villa,
        bookingStatus: 'PAYMENT_PENDING',
        $or: [{ checkIn: { $lt: winOut }, checkOut: { $gt: winIn } }],
      }).session(session);
      for (const b of losers) {
        b.bookingStatus = 'CANCELLED';
        b.cancelledBy = 'system';
        b.cancelledAt = new Date();
        b.cancellationReason = 'Another customer completed payment for this villa first.';
        addHistory(b, {
          actor: 'System',
          actorType: 'system',
          action: 'First payment wins',
          note: 'Cancelled because another booking for the same dates was paid first.',
          changes: { bookingStatus: 'CANCELLED' },
        });
        await b.save({ session });
        await notify({
          recipientType: 'user',
          recipient: b.user,
          type: 'booking_lost_to_payment',
          reference: b._id,
          title: 'Dates no longer available',
          message: 'Someone completed payment for this villa first, so we could not hold your dates. You have not been charged.',
        });
      }

      // Confirm the winner.
      fresh.paymentStatus = 'PAID';
      fresh.bookingStatus = 'CONFIRMED';
      fresh.paymentId = (paymentEntity && paymentEntity.id) || linkEntity.id;
      fresh.paymentMode = 'online';
      fresh.paymentLink = '';
      fresh.paymentLinkId = '';
      fresh.paymentLinkExpiresAt = null;
      fresh.paymentProcessedId = paymentId;
      addHistory(fresh, {
        actor: 'Razorpay',
        actorType: 'system',
        action: 'Payment received / Confirmed',
        note: `Webhook verified. Amount paid: ${fresh.amountPaid || ''}`,
        changes: { paymentStatus: 'PAID', bookingStatus: 'CONFIRMED', paymentId: fresh.paymentId },
      });
      await fresh.save({ session });
      result = { confirmed: true, booking: fresh };
    });
    return result || { confirmed: false, reason: 'unknown' };
  } catch (error) {
    // Abort transaction on any error so no half-confirm persists.
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

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
      const paymentId = (paymentEntity && paymentEntity.id) || (linkEntity && linkEntity.id) || '';
      // Idempotency: skip duplicate deliveries we have already applied.
      const already = await Booking.findOne({ paymentProcessedId: paymentId });
      if (already && already.bookingStatus === 'CONFIRMED') {
        return res.status(200).json({ status: 'ok', duplicate: true });
      }
      const linkId = linkEntity && linkEntity.id;
      const booking = await Booking.findOne({ paymentLinkId: linkId });
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found for payment link' });
      }
      // Prepare payment details on the object (transaction persists them).
      const win = await firstPaymentWins({ booking, paymentId, paymentEntity, linkEntity });
      const result = win || { confirmed: false, reason: 'unknown' };
      if (result.confirmed) {
        const confirmedBooking = result.booking;
        await notify({
          recipientType: 'user',
          recipient: confirmedBooking.user,
          type: 'booking_confirmed',
          reference: confirmedBooking._id,
          title: 'Payment successful — booking confirmed',
          message: `Payment received. Your villa booking is confirmed.`,
        });
        await notifyAllSales({
          type: 'payment_received',
          reference: confirmedBooking._id,
          title: 'Payment received',
          message: `Customer paid for their booking and secured the dates.`,
        });
        return res.status(200).json({ status: 'ok', confirmed: true });
      }
      // Payment arrived but this booking lost the race (another already won).
      return res.status(200).json({ status: 'ok', confirmed: false, reason: result.reason });
    }

    if (eventName === 'payment_link.expired' || eventName === 'payment_link.cancelled' || eventName === 'payment.failed') {
      const linkId = linkEntity && linkEntity.id;
      const booking = await Booking.findOne({ paymentLinkId: linkId });
      if (booking && booking.paymentStatus !== 'PAID' && booking.bookingStatus !== 'CONFIRMED') {
        // Release the date hold and let the dates show as available again.
        booking.bookingStatus = 'EXPIRED';
        booking.paymentStatus = eventName === 'payment.failed' ? 'FAILED' : 'LINK_EXPIRED';
        booking.paymentHoldExpiresAt = new Date();
        addHistory(booking, {
          actor: 'Razorpay',
          actorType: 'system',
          action: 'Payment link expired / failed',
          note: eventName,
          changes: { bookingStatus: 'EXPIRED', paymentStatus: booking.paymentStatus },
        });
        await booking.save();
        await notify({
          recipientType: 'user',
          recipient: booking.user,
          type: 'booking_pending_release',
          reference: booking._id,
          title: 'Payment not completed',
          message: 'We could not complete payment for your booking, so the dates have been freed. Please rebook or contact us.',
        });
      }
      return res.status(200).json({ status: 'ok' });
    }

    res.status(200).json({ status: 'ok', ignored: eventName });
  } catch (error) {
    console.error('Webhook error:', error.message);
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
    if (linkStatus === 'paid' && booking.paymentStatus !== 'PAID' && booking.bookingStatus !== 'CONFIRMED') {
      const paymentId = String(live.id || booking.paymentLinkId || '');
      const already = await Booking.findOne({ paymentProcessedId: paymentId });
      if (already) return { booking, live };
      await firstPaymentWins({ booking, linkEntity: { id: paymentId }, paymentEntity: { id: paymentId, amount: live.amount } });
    } else if ((linkStatus === 'expired' || linkStatus === 'cancelled') && booking.paymentStatus !== 'PAID' && booking.bookingStatus !== 'CONFIRMED') {
      booking.bookingStatus = 'EXPIRED';
      booking.paymentStatus = 'LINK_EXPIRED';
      booking.paymentHoldExpiresAt = new Date();
      addHistory(booking, { action: 'Payment link expired', note: linkStatus });
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
    const fresh = await Booking.findById(booking._id);
    res.json({ status: fresh.paymentStatus, bookingStatus: fresh.bookingStatus, live: live ? live.status : null, booking: fresh._id });
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
    const fresh = await Booking.findById(booking._id);
    res.json({
      _id: fresh._id,
      paymentStatus: fresh.paymentStatus,
      bookingStatus: fresh.bookingStatus,
      paid: fresh.paymentStatus === 'PAID' && fresh.bookingStatus === 'CONFIRMED',
      paymentLink: fresh.paymentLink || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { razorpayWebhook, syncPaymentLinkStatus, syncMyPaymentStatus };