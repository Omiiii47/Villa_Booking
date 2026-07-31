const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    villa: { type: mongoose.Schema.Types.ObjectId, ref: 'Villa', required: true },
    rating: { type: Number, required: [true, 'Please add a rating'], min: 1, max: 5 },
    comment: { type: String, required: [true, 'Please add a comment'] },
  },
  { timestamps: true }
);

reviewSchema.index({ villa: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
