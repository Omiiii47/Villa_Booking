const mongoose = require('mongoose');

const cmsSectionSchema = mongoose.Schema(
  {
    module: { type: String, enum: ['landing'], default: 'landing', index: true },
    section: {
      type: String,
      enum: ['hero', 'showcase', 'gallery', 'amenities', 'experiences', 'testimonials', 'faqs', 'newsletter'],
      index: true,
    },
    platform: { type: String, enum: ['desktop', 'mobile'], default: 'desktop', index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

cmsSectionSchema.index({ module: 1, section: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('CmsSection', cmsSectionSchema);
