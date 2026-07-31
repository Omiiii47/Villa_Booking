const Booking = require('../models/Booking');
const Villa = require('../models/Villa');

const createBooking = async (req, res) => {
  try {
    const { villa: villaId, checkIn, checkOut, guests, specialRequests } = req.body;

    const villa = await Villa.findById(villaId);
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * villa.pricePerNight;

    const overlapping = await Booking.findOne({
      villa: villaId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Villa is not available for these dates' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      villa: villaId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      specialRequests,
    });

    const populated = await Booking.findById(booking._id).populate('villa', 'name images pricePerNight');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
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
      .populate('villa', 'name images pricePerNight location slug description')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('villa', 'name images pricePerNight')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking, getAllBookings, updateBookingStatus };
