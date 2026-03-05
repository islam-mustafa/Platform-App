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
  toggleBanUser,     // ✅ الجديدة
  
  // دوال السوبر أدمن
  createAdmin,        // ✅ الجديدة
  deleteAdmin,        // ✅ الجديدة
} = require('../services/userService');

const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');

const router = express.Router();

// ==================== المستخدم العادي ====================
router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/change-password', changeMyPassword);
router.put('/me/image', uploadUserImage, resizeImage, updateMeWithImage);
router.delete('/me/image', deleteMyImage);
router.delete('/me', deactivateMe);

// ==================== الأدمن والسوبر أدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/ban', banUser);
router.patch('/:id/unban', unbanUser);
router.patch('/:id/toggle-ban', toggleBanUser);  // ✅ الراوت الجديد

// ==================== السوبر أدمن فقط ====================
router.use(allowedTo(ROLES.SUPER_ADMIN));

router.post('/admin', createAdmin);     // ✅ الراوت الجديد
router.delete('/admin/:id', deleteAdmin); // ✅ الراوت الجديد

module.exports = router;