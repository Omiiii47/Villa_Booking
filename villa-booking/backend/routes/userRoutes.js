const express = require('express');
const { getUsers, getUserById, deleteUser } = require('../controllers/userController');
const { adminProtect } = require('../middleware/adminAuth');

const router = express.Router();

router.use(adminProtect);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);

module.exports = router;
