const express = require("express");
const {
  signupValidator,
  loginValidator,
  refreshTokenValidator,
  logoutValidator,
  forgotPasswordValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
} = require("../validators/authValidator");

const {
  signup,
  login,
  forgetPassword,
  verifyPassResetCode,
  resetPassword,
  logout,
  logoutAllDevices,
  verifyEmail,
  refreshAccessToken,
  protect,
} = require("../controllers/authController");

const router = express.Router();

// Public routes
router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post('/refresh', refreshTokenValidator, refreshAccessToken);
router.get("/verifyEmail/:token", verifyEmail);
router.post("/forgotPassword", forgotPasswordValidator, forgetPassword);
router.post("/verifyResetCode", verifyResetCodeValidator, verifyPassResetCode);
router.put("/resetPassword", resetPasswordValidator, resetPassword);

// 🔐 Protected routes (كل اللي بعد كده محتاج توكن)
router.use(protect);

router.post("/logout", logoutValidator, logout);
router.post('/logoutAll', logoutAllDevices);  // protect موجود من الـ use

module.exports = router;