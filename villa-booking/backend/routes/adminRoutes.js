const express = require('express');
const { deleteReview } = require('../controllers/adminReviewController');
const { getLanding, updateLanding, uploadCmsImage, deleteCmsImage } = require('../controllers/cmsController');
const {
  listSalesTeam,
  createSalesTeamMember,
  deleteSalesTeamMember,
} = require('../controllers/adminSalesTeamController');
const { adminProtect } = require('../middleware/adminAuth');
const uploadMemory = require('../middleware/uploadMemory');
const {
  listContactMessages,
  markContactMessageRead,
  deleteContactMessage,
} = require('../controllers/contactController');

const router = express.Router();

router.use(adminProtect);

router.get('/cms', getLanding);
router.put('/cms', updateLanding);
router.post('/cms/upload', uploadMemory.single('image'), uploadCmsImage);
router.delete('/cms/image', deleteCmsImage);

router.get('/sales-team', listSalesTeam);
router.post('/sales-team', createSalesTeamMember);
router.delete('/sales-team/:id', deleteSalesTeamMember);

router.get('/contacts', listContactMessages);
router.put('/contacts/:id/read', markContactMessageRead);
router.delete('/contacts/:id', deleteContactMessage);

router.delete('/reviews/:id', deleteReview);

module.exports = router;
