const CmsSection = require('../models/CmsSection');
const cloudinary = require('../utils/cloudinary');

const LANDING_SECTIONS = ['hero', 'showcase', 'gallery', 'amenities', 'experiences', 'testimonials', 'faqs', 'newsletter'];
const LANDING_PLATFORMS = ['desktop', 'mobile'];

const img = (url) => ({ url, publicId: '' });

const HERO_DEFAULT = {
  eyebrow: 'Extraordinary Stays Await',
  titleLine1: 'Where Luxury',
  titleLine2: 'Meets Nature',
  subtitle:
    "Discover an exclusive collection of handpicked villas nestled in the world's most breathtaking destinations.",
  ctaPrimary: 'Explore Villas',
  ctaSecondary: 'Discover More',
  image: img('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=85'),
};

const SHOWCASE_ITEMS = [
  {
    name: 'The Grand Horizon', slug: 'the-grand-horizon',
    image: img('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'),
    tag: 'Oceanfront', price: '$2,500', desc: 'A breathtaking cliffside retreat with panoramic ocean views',
  },
  {
    name: 'Azure Cove Villa', slug: 'azure-cove-villa',
    image: img('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'),
    tag: 'Beachfront', price: '$3,200', desc: 'Private beachfront paradise with crystalline waters',
  },
  {
    name: 'The Emerald Canopy', slug: 'the-emerald-canopy',
    image: img('https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800'),
    tag: 'Rainforest', price: '$1,800', desc: 'A treetop sanctuary immersed in ancient rainforest',
  },
];

const GALLERY_IMAGES = [
  { image: img('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'), alt: 'The Grand Horizon', location: 'Cliffside Bay, Maldives', size: 'md' },
  { image: img('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'), alt: 'Infinity Serenity', location: 'Azure Coast, Greece', size: 'sm' },
  { image: img('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80'), alt: 'Sunset Pavilion', location: 'Tuscany, Italy', size: 'sm' },
  { image: img('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'), alt: 'Azure Cove', location: 'Private Beach, Seychelles', size: 'md' },
  { image: img('https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200&q=80'), alt: 'Golden Hour Lounge', location: 'Coastal Ridge, Bali', size: 'sm' },
  { image: img('https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=1200&q=80'), alt: 'Canopy Haven', location: 'Rainforest Reserve, Costa Rica', size: 'sm' },
  { image: img('https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200&q=80'), alt: 'Crystal Baths', location: 'Alpine Retreat, Switzerland', size: 'md' },
];

const AMENITY_ITEMS = [
  { icon: 'FaSwimmer', name: 'Infinity Pool', desc: 'Heated infinity edge pool with panoramic views' },
  { icon: 'FaUtensils', name: 'Private Chef', desc: 'In-villa dining with personal chef service' },
  { icon: 'FaSpa', name: 'Spa & Wellness', desc: 'Full-service spa with massage and treatments' },
  { icon: 'FaWineBottle', name: 'Wine Cellar', desc: 'Curated wine selection and sommelier service' },
  { icon: 'FaUmbrellaBeach', name: 'Private Beach', desc: 'Exclusive beach access with loungers' },
  { icon: 'FaPray', name: 'Yoga Pavilion', desc: 'Daily yoga and meditation sessions' },
];

const EXPERIENCE_ITEMS = [
  { icon: 'FaCompass', title: 'Guided Explorations', desc: 'Curated excursions led by local experts to hidden gems and breathtaking viewpoints.' },
  { icon: 'FaUtensils', title: 'Gourmet Dining', desc: 'Private chef experiences featuring locally-sourced ingredients and seasonal menus.' },
  { icon: 'FaSpa', title: 'Wellness Retreats', desc: 'Holistic wellness programs including yoga, meditation, and spa treatments.' },
  { icon: 'FaCamera', title: 'Photography Tours', desc: 'Capture unforgettable moments with professional photographer guides.' },
  { icon: 'FaWineGlassAlt', title: 'Wine Tastings', desc: 'Exclusive tastings of regional wines in stunning cellars and vineyards.' },
  { icon: 'FaMountain', title: 'Adventure Sports', desc: 'From hiking to water sports, curated adventures for every thrill level.' },
];

const TESTIMONIAL_ITEMS = [
  { name: 'Sarah & James Mitchell', location: 'London, UK', villa: 'The Grand Horizon', text: 'An absolutely transcendent experience. Every detail was curated with such care that we felt like the only people in the world. The sunset from the infinity pool is something we will never forget.', rating: 5 },
  { name: 'The Patel Family', location: 'Mumbai, India', villa: 'Azure Cove Villa', text: 'Our family reunion at Azure Cove was magical. The children loved the private beach, and we adults cherished the wine cellar and sunset dinners. Already planning our return.', rating: 5 },
  { name: 'Emma & Thomas Keller', location: 'Zurich, Switzerland', villa: 'The Mountain Aerie', text: 'The Mountain Aerie exceeded every expectation. Waking up to those alpine views with a crackling fire — pure poetry. The hot springs after a day of skiing were heavenly.', rating: 5 },
  { name: 'Olivia Chen', location: 'Singapore', villa: 'The Zen Pavilion', text: 'The Zen Pavilion is a masterpiece of tranquility. I found a peace there that I did not know was possible. The tea ceremony at dawn overlooking the bamboo forest was life-changing.', rating: 5 },
];

const FAQ_ITEMS = [
  { q: 'What is the booking process?', a: 'Simply browse our collection, select your desired villa and dates, and complete your booking online. A member of our concierge team will confirm your reservation within 24 hours.' },
  { q: 'Can I modify or cancel my booking?', a: 'Yes, modifications and cancellations are subject to our flexible policy. Full refunds are available up to 14 days before check-in, with partial refunds thereafter.' },
  { q: 'Are meals included in the villa price?', a: 'The villa price includes accommodation only. However, we offer private chef services, grocery pre-stocking, and local restaurant reservations upon request.' },
  { q: 'What amenities are provided in the villas?', a: 'All villas come fully equipped with premium linens, toiletries, kitchen essentials, WiFi, and smart entertainment systems. Specific amenities vary by villa.' },
  { q: 'Is airport transfer available?', a: 'Yes, we offer private airport transfers in luxury vehicles for all guests. This can be arranged during the booking process or by contacting our concierge team.' },
  { q: 'Are children allowed in all villas?', a: 'Most of our villas welcome children. Family-friendly amenities such as cribs, high chairs, and child-safe pools are available upon request.' },
];

const NEWSLETTER_DEFAULT = {
  label: 'Stay Connected',
  title: 'Join Our Concierge Circle',
  subtitle: 'Receive exclusive offers, new villa announcements, and curated travel inspiration.',
  placeholder: 'Your email address',
  buttonText: 'Subscribe',
  successTitle: 'Thank you!',
  successMessage: 'Welcome to the Solscape Stays family.',
};

const DEFAULT_LANDING = {
  desktop: {
    hero: HERO_DEFAULT,
    showcase: { label: 'Collection', title: 'Signature Villas', subtitle: "A hand-selected portfolio of the world's most extraordinary private villas.", items: SHOWCASE_ITEMS },
    gallery: { label: 'Gallery', title: 'A Visual Journey', subtitle: 'Explore the beauty and elegance that awaits at our handpicked destinations.', images: GALLERY_IMAGES },
    amenities: { label: 'Amenities', title: 'The Finest Experiences', subtitle: 'Every villa is curated with world-class amenities designed to elevate your stay.', items: AMENITY_ITEMS },
    experiences: { label: 'Experiences', title: 'Beyond The Villa', subtitle: 'Immersive experiences crafted to make your stay truly unforgettable.', items: EXPERIENCE_ITEMS },
    testimonials: { label: 'Testimonials', title: 'What Our Guests Say', items: TESTIMONIAL_ITEMS },
    faqs: { label: 'FAQ', title: 'Frequently Asked Questions', subtitle: 'Everything you need to know about booking your dream villa.', items: FAQ_ITEMS },
    newsletter: NEWSLETTER_DEFAULT,
  },
  mobile: {
    hero: HERO_DEFAULT,
    showcase: { label: 'Collection', title: 'Signature Villas', subtitle: "A hand-selected portfolio of the world's most extraordinary private villas.", items: SHOWCASE_ITEMS.slice(0, 2) },
    gallery: { label: 'Gallery', title: 'A Visual Journey', subtitle: 'Explore the beauty and elegance that awaits at our handpicked destinations.', images: GALLERY_IMAGES.slice(0, 6) },
    amenities: { label: 'Amenities', title: 'The Finest Experiences', subtitle: 'Every villa is curated with world-class amenities designed to elevate your stay.', items: AMENITY_ITEMS },
    experiences: { label: 'Experiences', title: 'Beyond The Villa', subtitle: 'Immersive experiences crafted to make your stay truly unforgettable.', items: EXPERIENCE_ITEMS },
    testimonials: { label: 'Testimonials', title: 'What Our Guests Say', items: TESTIMONIAL_ITEMS },
    faqs: { label: 'FAQ', title: 'Frequently Asked Questions', subtitle: 'Everything you need to know about booking your dream villa.', items: FAQ_ITEMS },
    newsletter: NEWSLETTER_DEFAULT,
  },
};

const getOrCreateSection = async (section, platform) => {
  let doc = await CmsSection.findOne({ module: 'landing', section, platform });
  if (!doc) {
    doc = await CmsSection.create({
      module: 'landing',
      section,
      platform,
      data: DEFAULT_LANDING[platform] && DEFAULT_LANDING[platform][section],
    });
  }
  return doc;
};

const buildLanding = async () => {
  const landing = { desktop: {}, mobile: {} };
  for (const platform of LANDING_PLATFORMS) {
    for (const section of LANDING_SECTIONS) {
      const doc = await getOrCreateSection(section, platform);
      landing[platform][section] = doc.data;
    }
  }
  return landing;
};

const getLanding = async (req, res) => {
  try {
    res.json(await buildLanding());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLanding = async (req, res) => {
  try {
    const { desktop, mobile } = req.body || {};
    const platforms = { desktop, mobile };
    for (const platform of LANDING_PLATFORMS) {
      const payload = platforms[platform];
      if (!payload || typeof payload !== 'object') continue;
      for (const section of LANDING_SECTIONS) {
        if (payload[section] && typeof payload[section] === 'object') {
          await CmsSection.updateOne(
            { module: 'landing', section, platform },
            { $set: { data: payload[section] } },
            { upsert: true }
          );
        }
      }
    }
    res.json(await buildLanding());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadCmsImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });
    if (!cloudinary.isConfigured()) {
      return res.status(500).json({ message: 'Cloudinary is not configured on the server' });
    }
    const result = await cloudinary.uploadImage(req.file.buffer, 'solscape/landing');
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCmsImage = async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId is required' });
    if (!cloudinary.isConfigured()) {
      return res.status(500).json({ message: 'Cloudinary is not configured on the server' });
    }
    const result = await cloudinary.deleteImage(publicId);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { DEFAULT_LANDING, getLanding, updateLanding, uploadCmsImage, deleteCmsImage };
