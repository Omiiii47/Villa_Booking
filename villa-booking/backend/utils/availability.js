const Booking = require('../models/Booking');

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const dateKey = (d) => startOfDay(d).toISOString();

const addDays = (d, n) => new Date(startOfDay(d).getTime() + n * DAY_MS);

/**
 * Enumerate inclusive day keys from `from` to `to` (both start-of-day).
 */
const daysInRange = (from, to) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  const out = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) out.push(new Date(t));
  return out;
};

const dateRangesOverlap = (aIn, aOut, bIn, bOut) => aIn < bOut && bIn < aOut;

/**
 * Compute per-date availability for a villa across a [from, to] date range.
 *
 * Returns a map: dateKey -> 'AVAILABLE' | 'PAYMENT_PENDING' | 'BOOKED' | 'BLOCKED'
 *
 * - BLOCKED:        admin-blocked via villa.blockedDates
 * - BOOKED:         a CONFIRMED (or COMPLETED) booking overlaps the date
 * - PAYMENT_PENDING: a booking in the payment hold window overlaps (yellow)
 * - AVAILABLE:       otherwise
 *
 * For one day emitted, a PAYMENT_PENDING booking that has an un-expired hold
 * window reserves that date. Expired holds are ignored (treated as available).
 */
const buildAvailability = async ({ villa, from, to, now = new Date() }) => {
  const days = daysInRange(from, to);
  const state = {};
  days.forEach((d) => { state[dateKey(d)] = 'AVAILABLE'; });

  const targets = days.map((d) => ({ in: dateKey(d), out: dateKey(d) + DAY_MS }));

  const blocked = (villa && villa.blockedDates) || [];
  blocked.forEach((b) => {
    const k = dateKey(b);
    if (state[k] !== undefined) state[k] = 'BLOCKED';
  });

  const overlapsAndPending = async () => {
    const bookings = await Booking.find({
      villa: villa._id,
      bookingStatus: { $in: ['CONFIRMED', 'COMPLETED', 'PAYMENT_PENDING'] },
      $or: [
        { checkIn: { $lt: to }, checkOut: { $gt: from } },
      ],
    }).lean();

    bookings.forEach((bk) => {
      const isConfirmed = bk.bookingStatus === 'CONFIRMED' || bk.bookingStatus === 'COMPLETED';
      try {
        const bkIn = startOfDay(bk.checkIn);
        const bkOut = startOfDay(bk.checkOut);
        const holdExpired = bk.paymentHoldExpiresAt && new Date(bk.paymentHoldExpiresAt).getTime() <= now.getTime();
        const pendingActive = bk.bookingStatus === 'PAYMENT_PENDING' && !holdExpired;
        targets.forEach((t) => {
          if (!dateRangesOverlap(t.in, t.out, bkIn, bkOut)) return;
          const k = t.in;
          if (state[k] === 'BLOCKED') return;
          if (isConfirmed) state[k] = 'BOOKED';
          else if (pendingActive && state[k] !== 'BOOKED') state[k] = 'PAYMENT_PENDING';
        });
      } catch { /* ignore individual malformed rows */ }
    });
  };

  await overlapsAndPending();
  return { state, dayKeys: days.map((d) => dateKey(d)) };
};
module.exports = { buildAvailability, dateKey, startOfDay, addDays, dateRangesOverlap };