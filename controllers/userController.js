const userService = require('../services/userService');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// Export all user service functions with asyncHandler wrapper
module.exports = {
  // Image handling (already middleware, no wrapping needed)
  uploadUserImage: userService.uploadUserImage,
  resizeImage: userService.resizeImage, // already has asyncHandler in service
  
  // User profile operations (already wrapped in service)
  getMe: userService.getMe,
  updateMeWithImage: userService.updateMeWithImage,
  deleteMyImage: userService.deleteMyImage,
  updateMe: userService.updateMe,
  changeMyPassword: userService.changeMyPassword,
  deactivateMe: userService.deactivateMe,
  
  // Admin operations (already wrapped in service)
  getUsers: userService.getUsers,
  getUser: userService.getUser,
  createUser: userService.createUser,
  updateUser: userService.updateUser,
  deleteUser: userService.deleteUser,
  banUser: userService.banUser,
  unbanUser: userService.unbanUser,
  createAdmin: userService.createAdmin,
};

