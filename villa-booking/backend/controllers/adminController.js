const SiteContent = require('../models/SiteContent');

const DEFAULT_SITE_CONTENT = {
  heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=85',
  gallery: [
    { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', alt: 'The Grand Horizon', location: 'Cliffside Bay, Maldives', size: 'md' },
    { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', alt: 'Infinity Serenity', location: 'Azure Coast, Greece', size: 'sm' },
    { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', alt: 'Sunset Pavilion', location: 'Tuscany, Italy', size: 'sm' },
    { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', alt: 'Azure Cove', location: 'Private Beach, Seychelles', size: 'md' },
    { src: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200&q=80', alt: 'Golden Hour Lounge', location: 'Coastal Ridge, Bali', size: 'sm' },
    { src: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=1200&q=80', alt: 'Canopy Haven', location: 'Rainforest Reserve, Costa Rica', size: 'sm' },
    { src: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200&q=80', alt: 'Crystal Baths', location: 'Alpine Retreat, Switzerland', size: 'md' },
  ],
  showcase: [
    { name: 'The Grand Horizon', slug: 'the-grand-horizon', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', tag: 'Oceanfront', price: '$2,500', desc: 'A breathtaking cliffside retreat with panoramic ocean views' },
    { name: 'Azure Cove Villa', slug: 'azure-cove-villa', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', tag: 'Beachfront', price: '$3,200', desc: 'Private beachfront paradise with crystalline waters' },
    { name: 'The Emerald Canopy', slug: 'the-emerald-canopy', image: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800', tag: 'Rainforest', price: '$1,800', desc: 'A treetop sanctuary immersed in ancient rainforest' },
  ],
};

const getOrCreateContent = async () => {
  let content = await SiteContent.findOne({});
  if (!content) {
    content = await SiteContent.create(DEFAULT_SITE_CONTENT);
  }
  return content;
};

const getSiteContent = async (req, res) => {
  try {
    const content = await getOrCreateContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSiteContent = async (req, res) => {
  try {
    let content = await SiteContent.findOne({});
    if (!content) {
      content = new SiteContent();
    }
    Object.assign(content, req.body);
    await content.save();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSiteContent, updateSiteContent, getOrCreateContent, DEFAULT_SITE_CONTENT };
