const mongoose = require('mongoose');

const galleryImageSchema = mongoose.Schema(
  {
    src: { type: String, default: '' },
    alt: { type: String, default: '' },
    location: { type: String, default: '' },
    size: { type: String, enum: ['sm', 'md'], default: 'sm' },
  },
  { _id: false }
);

const showcaseItemSchema = mongoose.Schema(
  {
    name: { type: String, default: '' },
    slug: { type: String, default: '' },
    image: { type: String, default: '' },
    tag: { type: String, default: '' },
    price: { type: String, default: '' },
    desc: { type: String, default: '' },
  },
  { _id: false }
);

const siteContentSchema = mongoose.Schema(
  {
    heroImage: { type: String, default: '' },
    gallery: [galleryImageSchema],
    showcase: [showcaseItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteContent', siteContentSchema);
