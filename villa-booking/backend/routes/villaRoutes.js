const express = require('express');
const {
  getVillas,
  getVillaBySlug,
  getVillaById,
  createVilla,
  updateVilla,
  deleteVilla,
  uploadImages,
  getFeaturedVillas,
} = require('../controllers/villaController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getVillas);
router.get('/featured', getFeaturedVillas);
router.get('/slug/:slug', getVillaBySlug);
router.get('/:id', getVillaById);
router.post('/', protect, admin, createVilla);
router.put('/:id', protect, admin, updateVilla);
router.delete('/:id', protect, admin, deleteVilla);
router.post('/upload-images', protect, admin, upload.array('images', 10), uploadImages);

module.exports = router;
