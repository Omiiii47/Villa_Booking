const express = require('express');
const { getUsers, getUserById, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserById);
router.put('/:id/role', protect, admin, updateUserRole);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
