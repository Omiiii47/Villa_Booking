const Villa = require('../models/Villa');

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
    else sortOption.createdAt = -1;

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
    const villa = await Villa.findOne({ slug: req.params.slug });
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

const createVilla = async (req, res) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const villa = await Villa.create({ ...req.body, slug });
    res.status(201).json(villa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVilla = async (req, res) => {
  try {
    const villa = await Villa.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
    const paths = files.map((file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
    res.json({ images: paths });
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

module.exports = {
  getVillas,
  getVillaBySlug,
  getVillaById,
  createVilla,
  updateVilla,
  deleteVilla,
  uploadImages,
  getFeaturedVillas,
};
