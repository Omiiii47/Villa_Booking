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
const { adminProtect } = require('../middleware/adminAuth');
const uploadMemory = require('../middleware/uploadMemory');

const router = express.Router();

router.get('/', getVillas);
router.get('/featured', getFeaturedVillas);
router.get('/slug/:slug', getVillaBySlug);
router.get('/:id', getVillaById);
router.post('/', adminProtect, createVilla);
router.put('/:id', adminProtect, updateVilla);
router.delete('/:id', adminProtect, deleteVilla);
router.post('/upload-images', adminProtect, uploadMemory.array('images', 10), uploadImages);

module.exports = router;
