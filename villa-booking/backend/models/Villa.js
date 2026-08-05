const mongoose = require('mongoose');

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const villaSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please add a villa name'] },
    slug: { type: String, unique: true },
    description: { type: String, required: [true, 'Please add a description'] },
    shortDescription: { type: String },
    pricePerNight: { type: Number, required: [true, 'Please add price per night'] },
    capacity: { type: Number, required: true, default: 2 },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    size: { type: String },
    location: { type: String, required: [true, 'Please add location'] },
    images: [{ type: String }],
    amenities: [{ type: String }],
    facilities: [{ type: String }],
    rules: [{ type: String }],
    featured: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    showBookNow: { type: Boolean, default: true },
    showExploreVilla: { type: Boolean, default: true },
  },
  { timestamps: true }
);



module.exports = mongoose.model('Villa', villaSchema);
