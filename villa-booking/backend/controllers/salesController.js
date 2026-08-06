const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Villa = require('../models/Villa');
const User = require('../models/User');

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

const listBookings = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, review, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (review === '1' || review === 'true') query.requiresManualReview = true;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ customerName: re }, { customerEmail: re }];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('villa', 'name images pricePerNight capacity location')
      .populate('user', 'name email phone')
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
      .populate('user', 'name email phone');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
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
    if (req.body.approvalReason !== undefined) booking.approvalReason = req.body.approvalReason;

    if (req.body.customPricing) {
      const pricing = buildPricing(booking, req.body.customPricing);
      booking.customPricing = pricing;
      booking.totalPrice = pricing.totalAmount;
      booking.isCustomBooking = true;
    }

    const villaDoc = await Villa.findById(booking.villa);
    if (villaDoc && (!req.body.customPricing || !booking.customPricing)) {
      booking.estimatedPrice = booking.nights * villaDoc.pricePerNight;
      if (!req.body.customPricing) {
        booking.totalPrice = booking.nights * villaDoc.pricePerNight;
      }
      applyCapacityFlags(booking, villaDoc);
    } else if (villaDoc) {
      applyCapacityFlags(booking, villaDoc);
    }

    if (req.body.sendOffer) {
      booking.offerSent = true;
      if (!booking.customPricing) {
        booking.customPricing = {
          basePrice: villaDoc.pricePerNight,
          extraGuestFee: 0,
          extraGuestCount: booking.extraGuests || 0,
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
          totalPerNight: villaDoc.pricePerNight,
          totalAmount: booking.nights * villaDoc.pricePerNight,
          offerMessage: req.body.customPricing?.offerMessage || booking.customPricing?.offerMessage || '',
        };
      }
    }

    await booking.save();
    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images pricePerNight capacity location')
      .populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewBooking = async (req, res) => {
  try {
    const { action, approvalReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (action === 'approve') {
      if (req.body.customPricing) {
        const pricing = buildPricing(booking, req.body.customPricing);
        booking.customPricing = pricing;
        booking.totalPrice = pricing.totalAmount;
        booking.isCustomBooking = true;
      }
      booking.status = 'confirmed';
      booking.requiresManualReview = false;
      booking.offerSent = true;
      booking.approvalReason = approvalReason || '';
      await booking.save();
      return res.json(booking);
    }

    if (action === 'reject') {
      booking.status = 'rejected';
      booking.requiresManualReview = false;
      booking.approvalReason = approvalReason || 'Request not approved';
      await booking.save();
      return res.json(booking);
    }

    return res.status(400).json({ message: "Invalid review action. Use 'approve' or 'reject'." });
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

    let user = await User.findOne({ email: customerEmail.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: customerName,
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
      adults: 1,
      kids: 0,
      infants: 0,
      pets: 0,
    });
    const nights = nightsBetween(checkIn, checkOut);
    applyGuestsAndCapacity(draft, { adults, kids, infants, pets });
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
    draft.status = 'pending';
    draft.offerSent = !!sendOffer;
    if (sendOffer && !pricing) {
      draft.customPricing = {
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
        totalPerNight: villa.pricePerNight,
        totalAmount: draft.totalPrice,
        offerMessage: '',
      };
    }

    const booking = await draft.save();
    const populated = await Booking.findById(booking._id)
      .populate('villa', 'name images pricePerNight capacity location')
      .populate('user', 'name email phone');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listBookings, getBooking, updateBooking, reviewBooking, createCustomBooking };
