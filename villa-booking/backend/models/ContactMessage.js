const mongoose = require('mongoose');

const contactMessageSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: '', trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

contactMessageSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
