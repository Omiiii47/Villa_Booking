const Villa = require('../models/Villa');
const cloudinary = require('../utils/cloudinary');
const { buildAvailability } = require('../utils/availability');

const getVillas = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, minPrice, maxPrice, bedrooms, location, featured, sort } = req.query;

    const query = {};

    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice) query.pricePerNight = { ...query.pricePerNight, $gte: Number(minPrice) };
    if (maxPrice) query.pricePerNight = { ...query.pricePerNight, $lte: Number(maxPrice) };
    if (bedrooms) query.bedrooms = Number(bedrooms);
    if (location) query.location = { $regex: location, $options: 'i' };
    if (featured) query.featured = featured === 'true';

    let sortOption = {};
    if (sort === 'price_asc') sortOption.pricePerNight = 1;
    else if (sort === 'price_desc') sortOption.pricePerNight = -1;
    else if (sort === 'rating') sortOption.rating = -1;
    else sortOption = { order: 1, createdAt: -1 };

    const total = await Villa.countDocuments(query);
    const villas = await Villa.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      villas,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVillaBySlug = async (req, res) => {
  try {
    const villa = await Villa.findOne({ slug: new RegExp(`^${req.params.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }
    res.json(villa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVillaById = async (req, res) => {
  try {
    const villa = await Villa.findById(req.params.id);
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }
    res.json(villa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const slugify = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const createUniqueSlug = async (name) => {
  const base = slugify(name) || 'villa';
  let candidate = base;
  let suffix = 1;
  while (await Villa.findOne({ slug: new RegExp(`^${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const createVilla = async (req, res) => {
  try {
    const slug = await createUniqueSlug(req.body.name);
    const villa = await Villa.create({ ...req.body, slug });
    res.status(201).json(villa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVilla = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.name) {
      const newSlug = slugify(body.name);
      const existing = await Villa.findOne({
        slug: new RegExp(`^${newSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        _id: { $ne: req.params.id },
      });
      body.slug = existing ? await createUniqueSlug(body.name) : newSlug;
    }
    const villa = await Villa.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }
    res.json(villa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVilla = async (req, res) => {
  try {
    const villa = await Villa.findByIdAndDelete(req.params.id);
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }
    res.json({ message: 'Villa removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadImages = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    if (!cloudinary.isConfigured()) {
      return res.status(500).json({ message: 'Cloudinary is not configured on the server' });
    }
    const results = await Promise.all(
      files.map((file) => cloudinary.uploadImage(file.buffer, 'solscape/villas'))
    );
    res.json({ images: results.map((r) => r.secure_url), publicIds: results.map((r) => r.public_id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeaturedVillas = async (req, res) => {
  try {
    const villas = await Villa.find({ featured: true }).limit(6);
    res.json(villas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAvailability = async (req, res) => {
  try {
    const villa = await Villa.findById(req.params.id);
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }
    const days = Math.min(Number(req.query.days) || 60, 365);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = today;
    const to = new Date(today.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
    const { state, dayKeys } = await buildAvailability({ villa, from, to });
    res.json({
      villa: villa._id,
      start: from.toISOString(),
      days,
      availability: state,
      dayKeys,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVillas,
  getVillaBySlug,
  getVillaById,
  createVilla,
  updateVilla,
  deleteVilla,
  uploadImages,
  getFeaturedVillas,
  getAvailability,
};
