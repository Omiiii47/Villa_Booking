const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipientType: { type: String, enum: ['user', 'sales', 'admin'], required: true },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientModel',
      required: true,
    },
    recipientModel: { type: String, enum: ['User', 'Admin'], default: 'User' },
    type: {
      type: String,
      enum: [
        'booking_submitted',
        'offer_sent',
        'booking_approved',
        'booking_rejected',
        'payment_received',
        'booking_confirmed',
        'booking_cancelled',
        'booking_completed',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientType: 1, recipient: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);