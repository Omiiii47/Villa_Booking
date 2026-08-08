const Booking = require('../models/Booking');

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/**
 * Local-date key in YYYY-MM-DD form, matching the key format the frontend
 * AvailabilityCalendar uses to look up per-date status.
 */
const dateKey = (d) => {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d, n) => new Date(startOfDay(d).getTime() + n * DAY_MS);

/**
 * Enumerate inclusive local-midnight timestamps from `from` to `to`.
 */
const daysInRange = (from, to) => {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  const out = [];
  for (let t = start; t <= end; t += DAY_MS) out.push(t);
  return out;
};

const dateRangesOverlap = (aIn, aOut, bIn, bOut) => aIn < bOut && bIn < aOut;

/**
 * Compute per-date availability for a villa across a [from, to] date range.
 *
 * Returns a map: YYYY-MM-DD -> 'AVAILABLE' | 'PAYMENT_PENDING' | 'BOOKED' | 'BLOCKED'
 *
 * - BLOCKED:        admin-blocked via villa.blockedDates
 * - BOOKED:         a CONFIRMED (or COMPLETED) booking overlaps the date
 * - PAYMENT_PENDING: a booking in the payment hold window overlaps (yellow)
 * - AVAILABLE:       otherwise
 *
 * For one day emitted, a PAYMENT_PENDING booking with an un-expired hold
 * window reserves that date. Expired holds are ignored (treated as available).
 */
const buildAvailability = async ({ villa, from, to, now = new Date() }) => {
  const dayMs = daysInRange(from, to);
  const state = {};
  dayMs.forEach((ms) => { state[dateKey(ms)] = 'AVAILABLE'; });

  const targets = dayMs.map((ms) => ({ key: dateKey(ms), in: ms, out: ms + DAY_MS }));

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
        const bkIn = startOfDay(bk.checkIn).getTime();
        const bkOut = startOfDay(bk.checkOut).getTime();
        const holdExpired = bk.paymentHoldExpiresAt && new Date(bk.paymentHoldExpiresAt).getTime() <= now.getTime();
        const pendingActive = bk.bookingStatus === 'PAYMENT_PENDING' && !holdExpired;
        targets.forEach((t) => {
          if (!dateRangesOverlap(t.in, t.out, bkIn, bkOut)) return;
          if (state[t.key] === 'BLOCKED') return;
          if (isConfirmed) {
            state[t.key] = 'BOOKED';
          } else if (pendingActive && state[t.key] !== 'BOOKED') {
            state[t.key] = 'PAYMENT_PENDING';
          }
        });
      } catch { /* ignore individual malformed rows */ }
    });
  };

  await overlapsAndPending();
  return { state, dayKeys: dayMs.map((ms) => dateKey(ms)) };
};
module.exports = { buildAvailability, dateKey, startOfDay, addDays, dateRangesOverlap };