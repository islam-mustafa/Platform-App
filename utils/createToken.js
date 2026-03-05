const jwt = require('jsonwebtoken');

// ✅ دالة إنشاء Access Token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRE_TIME }
  );
};

// ✅ دالة إنشاء Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || '7d' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};