const express = require('express');
const {
  // دوال المستخدم العادي
  getMe,
  updateMe,
  updateMeWithImage,
  changeMyPassword,
  deactivateMe,
  uploadUserImage,
  resizeImage,
  deleteMyImage,
  
  // دوال الأدمن
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  toggleBanUser,
  
  // دوال السوبر أدمن
  createAdmin,
  deleteAdmin,
} = require('../services/userService');

const {
  updateMeValidator,
  changeMyPasswordValidator,
  userIdValidator,
  createUserValidator,
  updateUserValidator,
} = require('../utils/validators/userValidator');

const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');

const router = express.Router();

// ==================== المستخدم العادي ====================
router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMeValidator, updateMe);
router.put('/me/change-password', changeMyPasswordValidator, changeMyPassword);
router.put('/me/image', uploadUserImage, resizeImage, updateMeWithImage);
router.delete('/me/image', deleteMyImage);
router.delete('/me', deactivateMe);

// ==================== الأدمن والسوبر أدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get('/', getUsers);
router.get('/:id', userIdValidator, getUser);
router.post('/', createUserValidator, createUser);
router.put('/:id', userIdValidator, updateUserValidator, updateUser);
router.delete('/:id', userIdValidator, deleteUser);
router.patch('/:id/ban', userIdValidator, banUser);
router.patch('/:id/unban', userIdValidator, unbanUser);
router.patch('/:id/toggle-ban', userIdValidator, toggleBanUser);

// ==================== السوبر أدمن فقط ====================
router.use(allowedTo(ROLES.SUPER_ADMIN));

router.post('/admin', createUserValidator, createAdmin); // createUserValidator مناسب لإنشاء أدمن
router.delete('/admin/:id', userIdValidator, deleteAdmin);

module.exports = router;