const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { verifyWebhookSignature, getPaymentLink, cancelPaymentLink, setupError } = require('../utils/razorpay');
const { addHistory, notifyAllSales } = require('../utils/bookingHistory');
const { notify } = require('../utils/notify');

/**
 * Core "first payment wins" logic: confirm the paying booking and, in the same
 * operation, expire every OTHER PAYMENT_PENDING booking overlapping the same
 * dates (deactivating their Razorpay links) so only one customer can ever win
 * a date range.
 *
 * `session` is optional. When provided the operations run inside a Mongo
 * transaction for atomicity (requires a replica set). Without one (single-node
 * MongoDB) it runs the same checks sequentially — idempotency via
 * `paymentProcessedId` plus the existing-winner / status guards keep it
 * single-payer correct for the normal flow.
 */
const applyWinner = async ({ bookingId, paymentId, paymentEntity, linkEntity, session }) => {
  const exec = (modelQuery) => (session ? modelQuery.session(session) : modelQuery);

  // Re-check the winning booking is still eligible.
  const fresh = await exec(Booking.findOne({ _id: bookingId }));
  if (!fresh) return { confirmed: false, reason: 'not_found' };
  if (fresh.bookingStatus === 'CONFIRMED' || fresh.bookingStatus === 'COMPLETED') {
    return { confirmed: false, reason: 'already_confirmed' };
  }
  if (fresh.paymentProcessedId && fresh.paymentProcessedId === paymentId) {
    return { confirmed: false, reason: 'already_processed' };
  }

  const winIn = new Date(fresh.checkIn);
  const winOut = new Date(fresh.checkOut);

  // Cross-check: another booking overlapping these dates must NOT already be
  // CONFIRMED. Never allow two confirmed bookings on the same range.
  const existingWinner = await exec(Booking.findOne({
    _id: { $ne: fresh._id },
    villa: fresh.villa,
    bookingStatus: { $in: ['CONFIRMED', 'COMPLETED'] },
    $or: [{ checkIn: { $lt: winOut }, checkOut: { $gt: winIn } }],
  }));
  if (existingWinner) {
    return { confirmed: false, reason: 'dates_taken' };
  }

  // Expire every overlapping PAYMENT_PENDING booking (this one excluded).
  const losers = await exec(Booking.find({
    _id: { $ne: fresh._id },
    villa: fresh.villa,
    bookingStatus: 'PAYMENT_PENDING',
    $or: [{ checkIn: { $lt: winOut }, checkOut: { $gt: winIn } }],
  }));
  for (const b of losers) {
    // Deactivate their Razorpay link so they can no longer complete payment.
    if (b.paymentLinkId) {
      try { await cancelPaymentLink(b.paymentLinkId); } catch { /* best effort */ }
    }
    b.bookingStatus = 'EXPIRED';
    b.paymentStatus = 'FAILED';
    b.paymentLink = '';
    b.paymentLinkId = '';
    b.paymentLinkExpiresAt = null;
    b.paymentHoldStartedAt = null;
    b.paymentHoldExpiresAt = null;
    b.cancelledBy = 'system';
    b.cancelledAt = new Date();
    b.cancellationReason = 'The villa was booked by another customer for these dates before your payment was completed. You have not been charged.';
    addHistory(b, {
      actor: 'System',
      actorType: 'system',
      action: 'First payment wins',
      note: 'Expired because another booking for the same dates was paid first.',
      changes: { bookingStatus: 'EXPIRED', paymentStatus: 'FAILED' },
    });
    if (session) await b.save({ session });
    else await b.save();
    await notify({
      recipientType: 'user',
      recipient: b.user,
      type: 'booking_lost_to_payment',
      reference: b._id,
      title: 'Dates no longer available',
      message: 'Another customer completed payment for this villa first, so these dates are no longer available. Your payment link has been deactivated and you have not been charged. You can book different dates or another villa.',
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
    note: 'Payment verified. Amount paid: ' + (fresh.amountPaid || ''),
    changes: { paymentStatus: 'PAID', bookingStatus: 'CONFIRMED', paymentId: fresh.paymentId },
  });
  if (session) await fresh.save({ session });
  else await fresh.save();
  return { confirmed: true, booking: fresh };
};

const firstPaymentWins = async ({ booking, paymentId, paymentEntity, linkEntity }) => {
  const session = await mongoose.startSession();
  try {
    let result;
    try {
      await session.withTransaction(async () => {
        result = await applyWinner({
          bookingId: booking._id, paymentId, paymentEntity, linkEntity, session,
        });
      });
      return result || { confirmed: false, reason: 'unknown' };
    } catch (txErr) {
      const unsupported = txErr && (txErr.code === 20 || /replica set member or mongos/.test(String(txErr.message || '')));
      if (!unsupported) throw txErr;
      // Single-node MongoDB does not support transactions. Fall back to the
      // guarded sequential path so confirmations still work locally.
    }
  } finally {
    try { await session.endSession(); } catch { /* noop */ }
  }
  return applyWinner({ bookingId: booking._id, paymentId, paymentEntity, linkEntity });
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
        booking.bookingStatus = 'EXPIRED';
        booking.paymentStatus = eventName === 'payment.failed' ? 'FAILED' : 'LINK_EXPIRED';
        booking.paymentHoldExpiresAt = new Date();
        if (eventName === 'payment_link.cancelled') {
          booking.paymentStatus = 'FAILED';
          booking.cancellationReason = 'Your payment link was deactivated because another customer completed payment for these dates first. You have not been charged.';
        }
        addHistory(booking, {
          actor: 'Razorpay',
          actorType: 'system',
          action: 'Payment link expired / cancelled / failed',
          note: eventName,
          changes: { bookingStatus: 'EXPIRED', paymentStatus: booking.paymentStatus },
        });
        await booking.save();
        await notify({
          recipientType: 'user',
          recipient: booking.user,
          type: 'booking_pending_release',
          reference: booking._id,
          title: 'Dates no longer available',
          message: booking.cancellationReason || 'We could not complete payment for your booking, so the dates have been freed. Please rebook or contact us.',
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
  // A booking that already lost the race (expired because the villa was booked
  // by another customer) must never be re-confirmed, even if its link is paid.
  if (['EXPIRED', 'CANCELLED'].includes(booking.bookingStatus)) return { booking, live: null };
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
      booking.paymentStatus = linkStatus === 'cancelled' ? 'FAILED' : 'LINK_EXPIRED';
      booking.paymentHoldExpiresAt = new Date();
      if (linkStatus === 'cancelled') {
        booking.cancellationReason = 'Your payment link was deactivated because another customer completed payment for these dates first. You have not been charged.';
      }
      addHistory(booking, {
        action: 'Payment link expired / cancelled',
        note: linkStatus,
        changes: { bookingStatus: 'EXPIRED', paymentStatus: booking.paymentStatus },
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