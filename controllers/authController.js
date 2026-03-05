const authService = require('../services/authService');

// Export auth service functions directly (they already have asyncHandler)
module.exports = {
  signup: authService.signup,
  login: authService.login,
  forgetPassword: authService.forgetPassword,
  verifyPassResetCode: authService.verifyPassResetCode,
  resetPassword: authService.resetPassword,
  logout: authService.logout,
  logoutAllDevices: authService.logoutAllDevices,
  verifyEmail: authService.verifyEmail,
  refreshAccessToken: authService.refreshAccessToken,
  protect: authService.protect,
  allowedTo: authService.allowedTo,
};
