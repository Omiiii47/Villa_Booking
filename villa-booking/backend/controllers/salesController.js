const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Villa = require('../models/Villa');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { addHistory, notifyAllSales } = require('../utils/bookingHistory');
const { notify } = require('../utils/notify');
const razorpay = require('../utils/razorpay');
const { holdExpiryFor, PAYMENT_HOLD_MINUTES } = require('../config/payment');
const nightsBetween = (checkIn, checkOut) => {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
};

const computeTotalPerNight = (p = {}) => {
  const n = (v) => Number(v) || 0;
  return Math.max(0,
    n(p.basePrice) +
    n(p.extraGuestFee) * n(p.extraGuestCount) +
    n(p.cleaningFee) +
    n(p.additionalServices) +
    n(p.housekeepingCharges) +
    n(p.beddingCharges) +
    n(p.securityCharges) +
    n(p.transportation) +
    n(p.chefServices) +
    n(p.decoration) +
    n(p.airportPickup) -
    n(p.discount)
  );
};

const buildPricing = (booking, customPricing) => {
  const prev = booking.customPricing || {};
  const p = customPricing || {};
  const take = (key) => (p[key] !== undefined && p[key] !== null && p[key] !== '' ? p[key] : prev[key] !== undefined ? prev[key] : 0);

  const merged = {
    basePrice: Number(take('basePrice')),
    extraGuestFee: Number(take('extraGuestFee')),
    extraGuestCount: Number(take('extraGuestCount') ?? booking.extraGuests ?? 0),
    cleaningFee: Number(take('cleaningFee')),
    additionalServices: Number(take('additionalServices')),
    housekeepingCharges: Number(take('housekeepingCharges')),
    beddingCharges: Number(take('beddingCharges')),
    securityCharges: Number(take('securityCharges')),
    transportation: Number(take('transportation')),
    chefServices: Number(take('chefServices')),
    decoration: Number(take('decoration')),
    airportPickup: Number(take('airportPickup')),
    discount: Number(take('discount')),
    complimentaryServices: (p.complimentaryServices !== undefined ? p.complimentaryServices : prev.complimentaryServices) || '',
    overrideAmount: p.overrideAmount !== undefined && p.overrideAmount !== null && p.overrideAmount !== '' ? Number(p.overrideAmount) : prev.overrideAmount,
    offerMessage: p.offerMessage !== undefined ? p.offerMessage : prev.offerMessage || '',
  };

  merged.totalPerNight = computeTotalPerNight(merged);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  merged.totalAmount =
    merged.overrideAmount !== undefined && merged.overrideAmount !== null
      ? merged.overrideAmount
      : merged.totalPerNight * nights;
  return merged;
};

const applyGuestsAndCapacity = (booking, { adults, kids, infants, pets }) => {
  if (adults !== undefined) booking.adults = Number(adults) || 1;
  if (kids !== undefined) booking.kids = Number(kids) || 0;
  if (infants !== undefined) booking.infants = Number(infants) || 0;
  if (pets !== undefined) booking.pets = Number(pets) || 0;
  const guestCount = Math.max(1, (booking.adults || 1) + (booking.kids || 0) + (booking.infants || 0));
  booking.guests = guestCount;
  return guestCount;
};

const applyCapacityFlags = (booking, villa) => {
  const guestCount = booking.guests;
  const isOverCapacity = guestCount > villa.capacity;
  booking.isCustomBooking = isOverCapacity;
  booking.requiresManualReview = isOverCapacity;
  booking.standardCapacity = villa.capacity;
  booking.requestedGuests = guestCount;
  booking.extraGuests = isOverCapacity ? guestCount - villa.capacity : 0;
  return isOverCapacity;
};

const applyQuotation = (booking, pricing) => {
  booking.customPricing = pricing;
  booking.totalPrice = pricing.totalAmount;
  booking.quotedPrice = pricing.totalAmount;
  booking.finalPrice = pricing.totalAmount;
  booking.isCustomBooking = true;
  booking.offerSent = true;
};

const listBookings = async (req, res) => {
  try {
    const { page = 1, limit = 50, review, booking, payment, search, status } = req.query;
    const query = {};

    if (status) {
      const legacyMap = {
        pending: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PAYMENT_PENDING'],
        'pending-custom': ['PAYMENT_PENDING'],
        'payment-pending': ['PAYMENT_PENDING'],
        confirmed: ['CONFIRMED'],
        cancelled: ['CANCELLED'],
        expired: ['EXPIRED'],
        completed: ['COMPLETED'],
        requested: ['REQUESTED'],
        'under-review': ['UNDER_REVIEW'],
        approved: ['APPROVED'],
        rejected: ['REJECTED'],
      };
      const mapped = legacyMap[status];
      if (mapped) {
        if (status === 'rejected') query.reviewStatus = 'REJECTED';
        else query.bookingStatus = { $in: mapped };
      }
    }
    if (review) {
      const val = review.toUpperCase();
      if (val === 'PENDING') {
        query.$or = [{ reviewStatus: 'PENDING' }, { reviewStatus: { $exists: false } }];
      } else {
        query.reviewStatus = val;
      }
    }
    if (booking) query.bookingStatus = booking.toUpperCase();
    if (payment) query.paymentStatus = payment.toUpperCase();
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ customerName: re }, { customerEmail: re }];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('villa', 'name images pricePerNight capacity location')
      .populate('user', 'name email phone')
      .populate('assignedSales', 'name email')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('villa', 'name images pricePerNight capacity location description')
      .populate('user', 'name email phone')
      .populate('assignedSales', 'name email')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.admin && req.admin.name) {
      booking.history.push({
        actor: req.admin.name,
        actorType: 'sales',
        action: 'Viewed by Sales',
        note: `${req.admin.name} opened this booking.`,
        at: new Date(),
      });
      if (booking.bookingStatus === 'REQUESTED') {
        booking.bookingStatus = 'UNDER_REVIEW';
      }
      await booking.save();
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus === 'REQUESTED') {
      booking.bookingStatus = 'UNDER_REVIEW';
    }

    if (req.body.villa) {
      const villa = await Villa.findById(req.body.villa);
      if (!villa) {
        return res.status(400).json({ message: 'Villa not found' });
      }
      booking.villa = villa._id;
    }

    if (req.body.checkIn) booking.checkIn = req.body.checkIn;
    if (req.body.checkOut) booking.checkOut = req.body.checkOut;

    if (req.body.adults !== undefined || req.body.kids !== undefined || req.body.infants !== undefined || req.body.pets !== undefined) {
      applyGuestsAndCapacity(booking, req.body);
    }

    if (booking.checkIn && booking.checkOut) {
      booking.nights = nightsBetween(booking.checkIn, booking.checkOut);
    }

    if (['purposeOfStay', 'arrivalTime', 'specialRequests', 'customerName', 'customerEmail', 'customerPhone', 'customerCountry'].some((k) => req.body[k] !== undefined)) {
      if (req.body.purposeOfStay !== undefined) booking.purposeOfStay = req.body.purposeOfStay;
      if (req.body.arrivalTime !== undefined) booking.arrivalTime = req.body.arrivalTime;
      if (req.body.specialRequests !== undefined) booking.specialRequests = req.body.specialRequests;
      if (req.body.customerName !== undefined) booking.customerName = req.body.customerName;
      if (req.body.customerEmail !== undefined) booking.customerEmail = req.body.customerEmail;
      if (req.body.customerPhone !== undefined) booking.customerPhone = req.body.customerPhone;
      if (req.body.customerCountry !== undefined) booking.customerCountry = req.body.customerCountry;
    }

    if (req.body.internalNotes !== undefined) booking.internalNotes = req.body.internalNotes;

    if (req.body.paymentLink !== undefined) {
      const paymentLink = String(req.body.paymentLink).trim();
      booking.paymentLink = paymentLink;
      if (paymentLink) booking.paymentStatus = 'PENDING';
    }

    if (req.body.customerId) booking.user = req.body.customerId;

    if (req.body.customPricing) {
      const pricing = buildPricing(booking, req.body.customPricing);
      applyQuotation(booking, pricing);
    }

    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Booking updated',
      note: 'Booking details edited by sales.',
      changes: { dates: [booking.checkIn, booking.checkOut], guests: booking.guests, villa: booking.villa },
    });

    await booking.save();
    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images pricePerNight capacity location')
      .populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.reviewStatus === 'REJECTED') {
      return res.status(400).json({ message: 'A rejected booking cannot be approved. Create a new booking instead.' });
    }

    const pricing = buildPricing(booking, req.body.customPricing);
    applyQuotation(booking, pricing);

    booking.reviewStatus = 'APPROVED';
    booking.bookingStatus = 'APPROVED';
    booking.requiresManualReview = false;
    booking.approvedBy = req.admin._id;
    booking.approvedAt = new Date();
    booking.approvedReason = req.body.approvalReason || '';
    booking.rejectionReason = '';
    booking.rejectedBy = null;
    booking.rejectedAt = null;
    booking.assignedSales = req.admin._id;

    const explicitLink = req.body.paymentLink ? String(req.body.paymentLink).trim() : '';
    if (explicitLink) {
      booking.paymentLink = explicitLink;
      booking.paymentStatus = 'PENDING';
      booking.bookingStatus = 'PAYMENT_PENDING';
      booking.paymentHoldStartedAt = new Date();
      booking.paymentHoldExpiresAt = holdExpiryFor();
    } else {
      if (razorpay.setupError()) {
        return res.status(400).json({ message: `A payment link is required to approve — ${razorpay.setupError()}` });
      }
      const amountPaise = bookingAmountInPaise(booking);
      if (amountPaise <= 0) {
        return res.status(400).json({ message: 'Cannot approve — the booking has no amount to charge.' });
      }
      const expiresAt = new Date(Date.now() + DEFAULT_PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
      const link = await razorpay.createPaymentLink({
        amount: amountPaise,
        currency: 'INR',
        description: `Villa booking payment — ${booking.customerName || 'Guest'}`,
        referenceId: String(booking._id),
        expireBy: Math.floor(expiresAt.getTime() / 1000),
        notes: { booking_id: String(booking._id) },
        customer: {
          name: booking.customerName || 'Guest',
          email: booking.customerEmail || '',
          contact: booking.customerPhone || '',
        },
      });
      booking.paymentLink = link.short_url;
      booking.paymentLinkId = link.id;
      booking.paymentLinkExpiresAt = expiresAt;
      booking.paymentStatus = 'LINK_SENT';
      booking.bookingStatus = 'PAYMENT_PENDING';
      booking.paymentHoldStartedAt = new Date();
      booking.paymentHoldExpiresAt = holdExpiryFor();
      booking.paymentHistory.push({
        linkId: link.id,
        url: link.short_url,
        amount: amountPaise / 100,
        currency: 'INR',
        status: String(link.status || 'issued'),
        expiresAt,
        source: 'razorpay',
        createdBy: req.admin._id,
      });
    }

    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Approved by Sales',
      note: `Quotation generated at $${pricing.totalAmount}`,
      changes: { reviewStatus: 'APPROVED', quotedPrice: pricing.totalAmount, paymentLink: booking.paymentLink },
    });

    await booking.save();

    await notify({
      recipientType: 'user',
      recipient: booking.user,
      type: 'booking_approved',
      reference: booking._id,
      title: 'Booking approved',
      message: `Your booking for the villa is approved. Final quotation: $${pricing.totalAmount}.`,
    });

    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images pricePerNight capacity location')
      .populate('user', 'name email phone')
      .populate('assignedSales', 'name email')
      .populate('approvedBy', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const reason = req.body.rejectionReason || req.body.reason;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'A rejection reason is required.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.reviewStatus = 'REJECTED';
    booking.requiresManualReview = false;
    booking.rejectedBy = req.admin._id;
    booking.rejectedAt = new Date();
    booking.rejectionReason = reason.trim();
    booking.approvalReason = '';

    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Rejected by Sales',
      note: reason.trim(),
    });

    await booking.save();

    await notify({
      recipientType: 'user',
      recipient: booking.user,
      type: 'booking_rejected',
      reference: booking._id,
      title: 'Booking rejected',
      message: `Unfortunately your booking request was not approved. Reason: ${reason.trim()}`,
    });

    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images capacity location')
      .populate('user', 'name email phone')
      .populate('rejectedBy', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.reviewStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'Booking must be approved before payment can be confirmed.' });
    }
    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ message: 'A cancelled booking cannot be confirmed.' });
    }
    if (!booking.paymentLink) {
      return res.status(400).json({ message: 'No payment link has been sent to the customer. Generate/send a payment link before confirming payment.' });
    }

    booking.bookingStatus = 'CONFIRMED';
    booking.paymentStatus = 'PAID';
    if (req.body.paymentId) booking.paymentId = req.body.paymentId;
    booking.paymentLink = '';
    booking.paymentLinkId = '';
    booking.paymentLinkExpiresAt = null;
    booking.paymentHoldExpiresAt = null;
    if (req.body.paymentId) booking.paymentProcessedId = String(req.body.paymentId);

    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Payment received / Confirmed',
      note: `Payment marked paid. Booking confirmed by ${req.admin.name}.`,
      changes: { paymentStatus: 'PAID', bookingStatus: 'CONFIRMED' },
    });

    await booking.save();

    // First-payment-wins: cancel overlapping PAYMENT_PENDING bookings so no
    // other customer can double-book these dates.
    const existingWinner = await Booking.findOne({
      _id: { $ne: booking._id },
      villa: booking.villa,
      bookingStatus: { $in: ['CONFIRMED', 'COMPLETED'] },
      $or: [{ checkIn: { $lt: booking.checkOut }, checkOut: { $gt: booking.checkIn } }],
    });
    if (existingWinner) {
      return res.status(409).json({ message: 'Another booking already secured these dates.' });
    }
    const losers = await Booking.find({
      _id: { $ne: booking._id },
      villa: booking.villa,
      bookingStatus: 'PAYMENT_PENDING',
      $or: [{ checkIn: { $lt: booking.checkOut }, checkOut: { $gt: booking.checkIn } }],
    });
    for (const b of losers) {
      if (b.paymentLinkId) {
        try { await razorpay.cancelPaymentLink(b.paymentLinkId); } catch { /* best effort */ }
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
      b.cancellationReason = 'Another customer completed payment for this villa first.';
      addHistory(b, {
        actor: 'System',
        actorType: 'system',
        action: 'First payment wins',
        note: 'Expired because another booking for the same dates was paid first.',
        changes: { bookingStatus: 'EXPIRED', paymentStatus: 'FAILED' },
      });
      await b.save();
      await notify({
        recipientType: 'user',
        recipient: b.user,
        type: 'booking_lost_to_payment',
        reference: b._id,
        title: 'Dates no longer available',
        message: 'Another customer completed payment for this villa first, so these dates are no longer available. Your payment link has been deactivated and you have not been charged.',
      });
    }

    await notify({
      recipientType: 'user',
      recipient: booking.user,
      type: 'booking_confirmed',
      reference: booking._id,
      title: 'Booking confirmed',
      message: 'Payment received. Your villa booking is confirmed. See you soon!',
    });

    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images capacity location')
      .populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
      return res.status(400).json({ message: 'This booking can no longer be cancelled.' });
    }

    booking.bookingStatus = 'CANCELLED';
    booking.cancelledBy = 'sales';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by Sales Team';
    if (booking.paymentStatus === 'PAID') booking.paymentStatus = 'REFUNDED';

    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Cancelled by Sales',
      note: booking.cancellationReason,
    });

    await booking.save();

    await notify({
      recipientType: 'user',
      recipient: booking.user,
      type: 'booking_cancelled',
      reference: booking._id,
      title: 'Booking cancelled',
      message: `Your booking was cancelled.${booking.paymentStatus === 'REFUNDED' ? ' Your payment will be refunded.' : ''}`,
    });

    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images capacity location')
      .populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ message: 'A cancelled booking cannot be completed.' });
    }
    if (booking.bookingStatus === 'COMPLETED') {
      return res.status(400).json({ message: 'Booking is already completed.' });
    }

    booking.bookingStatus = 'COMPLETED';
    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Completed',
      note: `Stay marked as completed by ${req.admin.name}.`,
      changes: { bookingStatus: 'COMPLETED' },
    });

    await booking.save();

    await notify({
      recipientType: 'user',
      recipient: booking.user,
      type: 'booking_completed',
      reference: booking._id,
      title: 'Stay completed',
      message: 'Your stay has been marked as completed. We hope you enjoyed yourself!',
    });

    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images capacity location')
      .populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const DEFAULT_PAYMENT_EXPIRY_HOURS = 24;

const bookingAmountInPaise = (booking) => Math.round((Number(booking.finalPrice) || Number(booking.quotedPrice) || Number(booking.totalPrice) || 0) * 100);

const createPaymentLink = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
      return res.status(400).json({ message: 'Payment links cannot be generated for this booking state.' });
    }
    if (razorpay.setupError()) {
      return res.status(400).json({ message: razorpay.setupError() });
    }

    const amountPaise = bookingAmountInPaise(booking);
    if (amountPaise <= 0) {
      return res.status(400).json({ message: 'Cannot generate a payment link — the booking has no amount.' });
    }

    const expiryHours = Number(req.body.expiryHours) || DEFAULT_PAYMENT_EXPIRY_HOURS;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const link = await razorpay.createPaymentLink({
      amount: amountPaise,
      currency: 'INR',
      description: `Villa booking payment — ${booking.customerName || 'Guest'}`,
      referenceId: String(booking._id),
      expireBy: Math.floor(expiresAt.getTime() / 1000),
      notes: { booking_id: String(booking._id) },
      customer: {
        name: booking.customerName || 'Guest',
        email: booking.customerEmail || '',
        contact: booking.customerPhone || '',
      },
    });

    booking.paymentLink = link.short_url;
    booking.paymentLinkId = link.id;
    booking.paymentLinkExpiresAt = expiresAt;
    booking.paymentStatus = 'LINK_SENT';
    booking.bookingStatus = 'PAYMENT_PENDING';
    booking.paymentHoldStartedAt = new Date();
    booking.paymentHoldExpiresAt = holdExpiryFor();
    booking.paymentHistory.push({
      linkId: link.id,
      url: link.short_url,
      amount: amountPaise / 100,
      currency: 'INR',
      status: String(link.status || 'issued'),
      expiresAt,
      source: 'razorpay',
      createdBy: req.admin._id,
    });

    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Payment link generated',
      note: `Razorpay payment link created (expires ${expiresAt.toISOString()}).`,
      changes: { paymentStatus: 'LINK_SENT', paymentLink: link.short_url },
    });

    await booking.save();

    await notify({
      recipientType: 'user',
      recipient: booking.user,
      type: 'booking_approved',
      reference: booking._id,
      title: 'Payment link sent',
      message: `A payment link for $${amountPaise / 100} has been sent. Open it in My Bookings to complete your payment.`,
    });

    res.json({
      booking: booking._id,
      paymentLink: link.short_url,
      paymentLinkId: link.id,
      expiresAt,
      expiresInHours: expiryHours,
      amount: amountPaise / 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPaymentDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    let live = null;
    if (booking.paymentLinkId) {
      try {
        live = await razorpay.getPaymentLink(booking.paymentLinkId);
      } catch {
        live = null;
      }
    }

    res.json({
      booking: booking._id,
      paymentLink: booking.paymentLink || '',
      paymentLinkId: booking.paymentLinkId || '',
      paymentLinkExpiresAt: booking.paymentLinkExpiresAt,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      amount: Number(booking.finalPrice) || Number(booking.quotedPrice) || Number(booking.totalPrice) || 0,
      amountPaid: booking.amountPaid,
      paymentId: booking.paymentId,
      paymentDate: booking.paymentDate,
      live: live
        ? { status: live.status, shortUrl: live.short_url, amount: live.amount ? live.amount / 100 : null, createdAt: live.created_at }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ paymentHistory: booking.paymentHistory || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearPaymentLink = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    booking.paymentLink = '';
    booking.paymentLinkId = '';
    booking.paymentLinkExpiresAt = null;
    booking.paymentHoldStartedAt = null;
    booking.paymentHoldExpiresAt = null;
    if (booking.paymentStatus === 'LINK_SENT' || booking.paymentStatus === 'LINK_EXPIRED') {
      booking.paymentStatus = 'UNPAID';
    }
    if (booking.bookingStatus === 'PAYMENT_PENDING') {
      booking.bookingStatus = 'APPROVED';
    }
    addHistory(booking, {
      actor: req.admin.name,
      actorType: 'sales',
      action: 'Payment link cleared',
      note: 'Active payment link removed by sales.',
    });
    await booking.save();
    res.json({ message: 'Payment link cleared', paymentStatus: booking.paymentStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const lookupUserByUsername = async (req, res) => {
  try {
    const username = String(req.query.username || '').trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const user = await User.findOne({ username }).select('name username email phone');
    if (!user) {
      return res.status(404).json({ message: 'No user found with this username' });
    }
    res.json({ _id: user._id, name: user.name, username: user.username, email: user.email, phone: user.phone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCustomBooking = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerCountry,
      username,
      villa: villaId,
      checkIn,
      checkOut,
      adults,
      kids,
      infants,
      pets,
      purposeOfStay,
      arrivalTime,
      specialRequests,
      internalNotes,
      customPricing,
      sendOffer,
    } = req.body;

    if (!customerName || !customerEmail) {
      return res.status(400).json({ message: 'Customer name and email are required' });
    }

    const villa = await Villa.findById(villaId);
    if (!villa) {
      return res.status(400).json({ message: 'Villa not found' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (!checkIn || !checkOut || checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    const adultsCount = Number(adults) || 1;
    const kidsCount = Number(kids) || 0;
    const infantsCount = Number(infants) || 0;
    const petsCount = Number(pets) || 0;
    const guestCount = Math.max(1, adultsCount + kidsCount + infantsCount);

    let user = null;
    if (username) {
      user = await User.findOne({ username: String(username).trim().toLowerCase() });
      if (!user) {
        return res.status(400).json({ message: 'No user found with this username' });
      }
    }
    if (!user) user = await User.findOne({ email: customerEmail.toLowerCase() });
    if (!user) {
      const baseUsername = (customerEmail.split('@')[0] || 'customer').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'customer';
      let username = baseUsername;
      let i = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${i}`;
        i += 1;
      }
      user = await User.create({
        name: customerName,
        username,
        email: customerEmail.toLowerCase(),
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
        phone: customerPhone,
      });
    }

    const draft = new Booking({
      user: user._id,
      villa: villa._id,
      checkIn,
      checkOut,
      adults: adultsCount,
      kids: kidsCount,
      infants: infantsCount,
      pets: petsCount,
      guests: guestCount,
      reviewStatus: 'PENDING',
      bookingStatus: 'REQUESTED',
      paymentStatus: 'UNPAID',
      history: [
        {
          actor: req.admin.name,
          actorType: 'sales',
          action: 'Custom booking created',
          note: `Created by ${req.admin.name} for ${customerName}.`,
          at: new Date(),
        },
      ],
    });
    const nights = nightsBetween(checkIn, checkOut);
    applyCapacityFlags(draft, villa);
    draft.nights = nights;

    let pricing = null;
    if (customPricing) {
      pricing = buildPricing(draft, customPricing);
      draft.customPricing = pricing;
    }

    draft.customerName = customerName;
    draft.customerEmail = customerEmail;
    draft.customerPhone = customerPhone;
    draft.customerCountry = customerCountry;
    draft.purposeOfStay = purposeOfStay;
    draft.arrivalTime = arrivalTime;
    draft.specialRequests = specialRequests;
    draft.internalNotes = internalNotes;
    draft.estimatedPrice = nights * villa.pricePerNight;
    draft.totalPrice = pricing ? pricing.totalAmount : nights * villa.pricePerNight;
    draft.offerSent = !!sendOffer;
    draft.assignedSales = req.admin._id;
    if (sendOffer) {
      if (!pricing) {
        pricing = buildPricing(draft, {
          basePrice: villa.pricePerNight,
          extraGuestFee: 0,
          extraGuestCount: draft.extraGuests || 0,
          cleaningFee: 0,
          additionalServices: 0,
          housekeepingCharges: 0,
          beddingCharges: 0,
          securityCharges: 0,
          transportation: 0,
          chefServices: 0,
          decoration: 0,
          airportPickup: 0,
          discount: 0,
          complimentaryServices: '',
          overrideAmount: null,
          offerMessage: '',
        });
        draft.customPricing = pricing;
      }
      applyQuotation(draft, pricing);
      draft.reviewStatus = 'APPROVED';
      draft.bookingStatus = 'APPROVED';
      draft.requiresManualReview = false;
      draft.approvedBy = req.admin._id;
      draft.approvedAt = new Date();
    }

    const booking = await draft.save();

    if (sendOffer) {
      if (razorpay.setupError()) {
        return res.status(400).json({ message: `A payment link is required to send an offer — ${razorpay.setupError()}` });
      }
      const amountPaise = bookingAmountInPaise(booking);
      if (amountPaise <= 0) {
        return res.status(400).json({ message: 'Cannot send an offer — the booking has no amount to charge.' });
      }
      const expiresAt = new Date(Date.now() + DEFAULT_PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
      const link = await razorpay.createPaymentLink({
        amount: amountPaise,
        currency: 'INR',
        description: `Villa booking payment — ${booking.customerName || 'Guest'}`,
        referenceId: String(booking._id),
        expireBy: Math.floor(expiresAt.getTime() / 1000),
        notes: { booking_id: String(booking._id) },
        customer: {
          name: booking.customerName || 'Guest',
          email: booking.customerEmail || '',
          contact: booking.customerPhone || '',
        },
      });
      booking.paymentLink = link.short_url;
      booking.paymentLinkId = link.id;
      booking.paymentLinkExpiresAt = expiresAt;
      booking.paymentStatus = 'LINK_SENT';
      booking.bookingStatus = 'PAYMENT_PENDING';
      booking.paymentHoldStartedAt = new Date();
      booking.paymentHoldExpiresAt = holdExpiryFor();
      booking.paymentHistory.push({
        linkId: link.id,
        url: link.short_url,
        amount: amountPaise / 100,
        currency: 'INR',
        status: String(link.status || 'issued'),
        expiresAt,
        source: 'razorpay',
        createdBy: req.admin._id,
      });
      addHistory(booking, {
        actor: req.admin.name,
        actorType: 'sales',
        action: 'Custom offer sent with payment link',
        note: `Quotation generated at $${pricing.totalAmount} and payment link sent to the customer.`,
        changes: { reviewStatus: 'APPROVED', bookingStatus: 'PAYMENT_PENDING', quotedPrice: pricing.totalAmount, paymentLink: booking.paymentLink },
      });
      await booking.save();

      await notify({
        recipientType: 'user',
        recipient: booking.user,
        type: 'booking_approved',
        reference: booking._id,
        title: 'Your booking offer is ready',
        message: `Your custom booking offer for ${villa.name} is approved. Final quotation: $${pricing.totalAmount}. A payment link is on your dashboard — complete payment to confirm.`,
      });
      await notifyAllSales({
        type: 'offer_sent',
        reference: booking._id,
        title: 'Custom offer sent',
        message: `${req.admin.name} sent a custom booking offer with a payment link.`,
      });
    }

    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images pricePerNight capacity location')
      .populate('user', 'name email phone');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [byReviewR, byBookingR, revenueAgg, todayCount, upcomingInCount, upcomingOutCount, awaitingPaymentCount, villas] = await Promise.all([
      Booking.aggregate([{ $group: { _id: '$reviewStatus', count: { $sum: 1 } } }]),
      Booking.aggregate([{ $group: { _id: '$bookingStatus', count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$finalPrice' } } }]),
      Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Booking.countDocuments({ checkIn: { $gte: today }, bookingStatus: 'CONFIRMED' }),
      Booking.countDocuments({ checkOut: { $gte: today }, bookingStatus: 'CONFIRMED' }),
      Booking.countDocuments({ bookingStatus: 'PAYMENT_PENDING', reviewStatus: 'APPROVED' }),
      Villa.find().select('capacity').lean(),
    ]);

    const reviewMap = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    byReviewR.forEach((r) => {
      const key = r._id || 'PENDING';
      if (reviewMap[key] !== undefined) reviewMap[key] = r.count;
      else reviewMap.PENDING += r.count;
    });

    const bookingMap = { REQUESTED: 0, UNDER_REVIEW: 0, APPROVED: 0, PAYMENT_PENDING: 0, CONFIRMED: 0, CANCELLED: 0, EXPIRED: 0, COMPLETED: 0 };
    byBookingR.forEach((b) => {
      const key = b._id || 'REQUESTED';
      if (bookingMap[key] !== undefined) bookingMap[key] = b.count;
      else bookingMap.REQUESTED += b.count;
    });

    const revenueValue = revenueAgg.length ? revenueAgg[0].total : 0;
    const paidBookingCount = bookingMap.CONFIRMED + bookingMap.COMPLETED;
    const averageBookingValue = paidBookingCount > 0 ? Math.round(revenueValue / paidBookingCount) : 0;

    const totalCapacity = villas.reduce((sum, v) => sum + (Number(v.capacity) || 0), 0);
    const occupancyPct = totalCapacity > 0 ? Math.min(100, Math.round((paidBookingCount / totalCapacity) * 100)) : 0;

    res.json({
      reviews: {
        pending: reviewMap.PENDING,
        approved: reviewMap.APPROVED,
        rejected: reviewMap.REJECTED,
      },
      bookings: {
        requested: bookingMap.REQUESTED,
        underReview: bookingMap.UNDER_REVIEW,
        approved: bookingMap.APPROVED,
        paymentPending: bookingMap.PAYMENT_PENDING,
        confirmed: bookingMap.CONFIRMED,
        cancelled: bookingMap.CANCELLED,
        expired: bookingMap.EXPIRED,
        completed: bookingMap.COMPLETED,
      },
      awaitingPayment: awaitingPaymentCount,
      revenue: revenueValue || 0,
      todayBookings: todayCount,
      upcomingCheckIns: upcomingInCount,
      upcomingCheckOuts: upcomingOutCount,
      occupancy: occupancyPct,
      averageBookingValue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientType: 'sales',
      recipient: req.admin._id,
    })
      .populate('reference', 'customerName villa checkIn checkOut')
      .populate({ path: 'reference', populate: { path: 'villa', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(60);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    const { ids, all } = req.body;
    if (all && all === true) {
      await Notification.updateMany({ recipientType: 'sales', recipient: req.admin._id, read: false }, { $set: { read: true, readAt: new Date() } });
    } else if (Array.isArray(ids) && ids.length) {
      await Notification.updateMany(
        { _id: { $in: ids }, recipientType: 'sales', recipient: req.admin._id },
        { $set: { read: true, readAt: new Date() } }
      );
    }
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};