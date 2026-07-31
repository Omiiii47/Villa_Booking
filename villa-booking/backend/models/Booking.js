const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    villa: { type: mongoose.Schema.Types.ObjectId, ref: 'Villa', required: true },
    checkIn: { type: Date, required: [true, 'Please add check-in date'] },
    checkOut: { type: Date, required: [true, 'Please add check-out date'] },
    guests: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    specialRequests: { type: String },
    paymentMethod: { type: String, default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
