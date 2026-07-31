const mongoose = require('mongoose');

const amenitySchema = mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please add amenity name'] },
    icon: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Amenity', amenitySchema);
