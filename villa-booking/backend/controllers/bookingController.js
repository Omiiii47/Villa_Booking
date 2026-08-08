const Booking = require('../models/Booking');
const Villa = require('../models/Villa');
const { addHistory, notifyAllSales } = require('../utils/bookingHistory');
const { notify } = require('../utils/notify');
const { buildAvailability, dateKey } = require('../utils/availability');
const { holdExpiryFor } = require('../config/payment');

const createBooking = async (req, res) => {
  try {
    const {
      villa: villaId,
      checkIn,
      checkOut,
      adults,
      kids,
      infants,
      pets,
      purposeOfStay,
      arrivalTime,
      customerPhone,
      customerCountry,
      specialRequests,
    } = req.body;

    const villa = await Villa.findById(villaId);
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    if (!purposeOfStay || !String(purposeOfStay).trim()) {
      return res.status(400).json({ message: 'Please add a purpose of stay' });
    }

    if (!customerPhone || !String(customerPhone).trim()) {
      return res.status(400).json({ message: 'Please add a contact phone number' });
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const estimatedPrice = nights * villa.pricePerNight;

    const adultsCount = Number(adults) || 1;
    const kidsCount = Number(kids) || 0;
    const infantsCount = Number(infants) || 0;
    const petsCount = Number(pets) || 0;
    const guestCount = Math.max(1, adultsCount + kidsCount + infantsCount);
    const isOverCapacity = guestCount > villa.capacity;
    const extraGuests = isOverCapacity ? guestCount - villa.capacity : 0;

    // Only dates that are not already booked or admin-blocked are selectable.
    // PAYMENT_PENDING bookings do NOT hold dates — many customers may request
    // the same range and the first successful payment wins.
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const from = checkInDate;
    const to = checkOutDate;
    const { state } = await buildAvailability({ villa, from, to });
    let firstBusy = null;
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
      const s = state[dateKey(d)];
      if (s === 'BOOKED' || s === 'BLOCKED') {
        firstBusy = { date: dateKey(d), state: s };
        break;
      }
    }
    if (firstBusy) {
      return res.status(400).json({ message: 'This villa is not available for these dates.' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      villa: villaId,
      checkIn,
      checkOut,
      nights,
      guests: guestCount,
      adults: adultsCount,
      kids: kidsCount,
      infants: infantsCount,
      pets: petsCount,
      totalPrice: 0,
      estimatedPrice: 0,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone,
      customerCountry,
      purposeOfStay,
      arrivalTime,
      specialRequests,
      reviewStatus: 'PENDING',
      bookingStatus: 'REQUESTED',
      paymentStatus: 'UNPAID',
      isCustomBooking: isOverCapacity,
      requiresManualReview: isOverCapacity,
      standardCapacity: isOverCapacity ? villa.capacity : undefined,
      requestedGuests: isOverCapacity ? guestCount : undefined,
      extraGuests: isOverCapacity ? extraGuests : undefined,
      history: [
        {
          actor: req.user.name,
          actorType: 'user',
          action: 'Booking created',
          note: `${villa.name} · ${guestCount} guest(s) · ${nights} night(s)`,
          at: new Date(),
        },
      ],
      customPricing: isOverCapacity
        ? {
            basePrice: villa.pricePerNight,
            extraGuestFee: 0,
            extraGuestCount: extraGuests,
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
            totalPerNight: 0,
            totalAmount: 0,
          }
        : undefined,
    });

    await notifyAllSales({
      type: 'booking_submitted',
      reference: booking._id,
      title: 'New booking request',
      message: `${req.user.name} requested ${villa.name} (${nights} night(s), ${guestCount} guest(s)).`,
    });

    const populated = await Booking.findById(booking._id).populate('villa', 'name images pricePerNight capacity location');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .select('-internalNotes -history')
      .populate('villa', 'name images pricePerNight location slug')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .select('-internalNotes -history')
      .populate('villa', 'name images pricePerNight location slug description')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
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

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PAYMENT_PENDING'].includes(booking.bookingStatus)) {
      // allowed — fall through
    } else {
      return res.status(400).json({
        message: 'This booking can no longer be cancelled.',
      });
    }

    booking.bookingStatus = 'CANCELLED';
    booking.cancelledBy = 'customer';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Customer cancelled the booking';
    booking.paymentHoldStartedAt = null;
    booking.paymentHoldExpiresAt = null;
    if (booking.paymentStatus === 'PAID') booking.paymentStatus = 'REFUNDED';
    addHistory(booking, {
      actor: req.user.name,
      actorType: 'user',
      action: 'Booking cancelled',
      note: booking.cancellationReason,
    });
    await booking.save();

    await notifyAllSales({
      type: 'booking_cancelled',
      reference: booking._id,
      title: 'Booking cancelled by customer',
      message: `${req.user.name} cancelled their booking.`,
    });

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking };