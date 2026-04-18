var crypto = require("crypto");
const asyncHandler = require("express-async-handler");

const ApiError = require("../utils/apiError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const { generateAccessToken, generateRefreshToken } = require("../utils/createToken");
const { sanitizeUser } = require("../utils/sanitizeData");

const User = require("../models/userModel");
const RefreshToken = require("../models/refreshTokenModel");

// ✅ استخدام المتغير من .env مع قيمة افتراضية 7 أيام
const REFRESH_TOKEN_EXPIRE_TIME = process.env.JWT_REFRESH_EXPIRE_TIME || '7d';

// تحويل مدة الصلاحية إلى ملي ثانية (للتخزين في قاعدة البيانات)
const parseExpiryToMs = (expiryString) => {
  const unit = expiryString.slice(-1);
  const value = parseInt(expiryString.slice(0, -1));
  
  switch(unit) {
    case 'm': return value * 60 * 1000;        // دقائق
    case 'h': return value * 60 * 60 * 1000;   // ساعات
    case 'd': return value * 24 * 60 * 60 * 1000; // أيام
    default: return value * 24 * 60 * 60 * 1000; // افتراضي أيام
  }
};

const REFRESH_TOKEN_TTL_MS = parseExpiryToMs(REFRESH_TOKEN_EXPIRE_TIME);

const createAndStoreRefreshToken = async (userId) => {
  const refreshToken = generateRefreshToken(userId);
  await RefreshToken.create({
    token: refreshToken,
    user: userId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return refreshToken;
};

// @desc    Signup
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  console.log('📍 [1] Signup started');
  
  try {
    // التحقق من تطابق كلمة المرور
    if (req.body.password !== req.body.passwordConfirm) {
      return next(new ApiError('Password and password confirmation do not match', 400));
    }
    
    console.log('📍 [3] Creating user...');
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      parentPhone: req.body.parentPhone,
      role: req.body.role || 'user',
    });
    console.log('📍 [4] User created:', user._id);

    // ✅ Dev mode: Auto-verify email
    if (process.env.EMAIL_VERIFICATION_REQUIRED === 'false') {
      console.log('📍 [Dev Mode] Auto-verifying email...');
      user.emailVerified = true;
      await user.save({ validateBeforeSave: false });
      
      // Generate token
      const accessToken = generateAccessToken(user._id);
      const refreshToken = await createAndStoreRefreshToken(user._id);
      
      return res.status(201).json({
        status: "success",
        message: "User created successfully (dev mode)",
        data: sanitizeUser(user),
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    }

    // ✅ Production mode: Send verification email
    console.log('📍 [5] Creating verification token...');
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    
    console.log('📍 [6] Saving user with verification token...');
    await user.save({ validateBeforeSave: false });
    console.log('📍 [7] User saved with token');

    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/verifyEmail/${verificationToken}`;

    console.log('📍 [8] Sending email...');
    await sendEmail({
      email: user.email,
      subject: "Verify your email",
      message: `Verify your email using this link:\n${verificationUrl}\n\nThis link expires in 10 minutes`,
    });
    console.log('📍 [9] Email sent');

    console.log('📍 [10] Sending response');
    res.status(201).json({
      status: "success",
      message: "User created successfully, please verify email",
      data: sanitizeUser(user),
    });
    
  } catch (error) {
    console.log('💥 [ERROR] Caught in try/catch:', error.message);
    console.log('💥 [ERROR] Stack:', error.stack);
    return next(error);
  }
});

/**
 * @desc    Login user and return tokens
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  console.log('[Login] Attempting login for email:', req.body.email);
  
  // Find user and select password field
  const user = await User.findOne({ email: req.body.email }).select("+password");

  // Validate user exists
  if (!user) {
    console.warn('[Login] User not found:', req.body.email);
    return next(new ApiError("Incorrect email or password", 401));
  }
  
  if (!user.password) {
    console.warn('[Login] User has no password field:', user.email);
    return next(new ApiError("Incorrect email or password", 401));
  }
  
  if (!user.active) {
    console.warn('[Login] User account deactivated:', user.email);
    return next(new ApiError("Your account has been deactivated", 401));
  }

  if (user.isBanned) {
    console.warn('[Login] User account banned:', user.email);
    return next(new ApiError("Your account has been banned", 401));
  }

  // Validate password
  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) {
    console.warn('[Login] Invalid password for user:', user.email);
    return next(new ApiError("Incorrect email or password", 401));
  }

  // ✅ Check email verification with dev mode support
  if (process.env.EMAIL_VERIFICATION_REQUIRED === 'false') {
    // Dev mode: Auto-verify if not verified
    if (!user.emailVerified) {
      console.log('[Login] Dev mode: Auto-verifying email for:', user.email);
      user.emailVerified = true;
      await user.save({ validateBeforeSave: false });
    }
  } else {
    // Production mode: Require verification
    if (!user.emailVerified) {
      console.warn('[Login] Email not verified:', user.email);
      return next(new ApiError("Please verify your email first", 403));
    }
  }

  // Clean up expired refresh tokens
  try {
    await RefreshToken.deleteMany({
      user: user._id,
      expiresAt: { $lte: new Date() },
    });
    console.log('[Login] Expired tokens cleaned up for user:', user.email);
  } catch (err) {
    console.error('[Login] Error cleaning expired tokens:', err.message);
  }

  // Generate new tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = await createAndStoreRefreshToken(user._id);
  
  console.log('[Login] Tokens generated successfully for user:', user.email);

  res.status(200).json({
    status: "success",
    data: sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  });
});

/**
 * @desc    Refresh access token with rotation (delete old, create new)
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
exports.refreshAccessToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    console.warn('[Refresh] No refresh token provided');
    return next(new ApiError('Refresh token required', 401));
  }
  console.log('[Refresh] Processing refresh token request');

  // Check if token exists in database
  const storedToken = await RefreshToken.findOne({ token: refreshToken });

  if (!storedToken) {
    console.warn('[Refresh] Token not found in database');
    return next(new ApiError('Invalid refresh token', 403));
  }

  if (storedToken.expiresAt <= new Date()) {
    console.warn('[Refresh] Refresh token expired, deleting from database');
    await RefreshToken.deleteOne({ _id: storedToken._id });
    return next(new ApiError('Refresh token expired', 403));
  }
  console.log('[Refresh] Token found in database, user ID:', storedToken.user);

  // Verify token signature
  let decoded;
  try {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      console.error('[Refresh] JWT_REFRESH_SECRET not found');
      throw new Error('JWT_REFRESH_SECRET is missing');
    }
    
    decoded = jwt.verify(refreshToken, secret);
    console.log('[Refresh] Token verified, decoded ID:', decoded.id);
  } catch (err) {
    console.error('[Refresh] Token verification failed:', err.message);
    await RefreshToken.deleteOne({ token: refreshToken });
    return next(new ApiError('Refresh token invalid or expired', 403));
  }

  // Verify token belongs to correct user
  if (decoded.id.toString() !== storedToken.user.toString()) {
    console.warn('[Refresh] Token user mismatch, deleting token');
    await RefreshToken.deleteOne({ _id: storedToken._id });
    return next(new ApiError("Invalid refresh token", 403));
  }
  console.log('[Refresh] Token user match verified');

  // Delete old refresh token (rotation)
  await RefreshToken.deleteOne({ _id: storedToken._id });
  console.log('[Refresh] Old token deleted (rotation)');

  // Generate new tokens
  const newAccessToken = generateAccessToken(decoded.id);
  const newRefreshToken = await createAndStoreRefreshToken(decoded.id);
  console.log('[Refresh] New tokens generated for user:', decoded.id);

  res.status(200).json({
    status: 'success',
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});


exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const token = req.params.token;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {

    return res.status(400).json({
      status: "fail",
      message: "Invalid or expired verification token",
    });

  }

  user.emailVerified = true;

  user.emailVerificationToken = undefined;

  user.emailVerificationExpires = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});

/**
 * @desc Verify JWT token and attach user to request
 * @route All protected routes
 * @access Private
 */
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Extract token from Authorization header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.slice(7);  // Remove "Bearer " prefix
  }
  
  if (!token) {
    console.warn('[Auth] No token provided in Authorization header');
    return next(
      new ApiError("You are not logged in. Please login first", 401)
    );
  }
  console.log('[Auth] Token extracted, length:', token.length);

  // 2) Verify token with JWT_SECRET
  let decoded;
  try {
    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!secret) {
      console.error('[Auth] JWT_SECRET not found in environment variables');
      throw new Error('JWT_SECRET environment variable is missing');
    }
    
    decoded = jwt.verify(token, secret);
    console.log('[Auth] Token verified successfully for user:', decoded.id);
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError('Token expired. Please refresh your token', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token. Please login again', 401));
    }
    return next(new ApiError('Token verification failed', 401));
  }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  
  if (!currentUser) {
    console.warn('[Auth] User not found for token ID:', decoded.id);
    return next(
      new ApiError(
        "the user that belong to this token does no longer exist",
        401
      )
    );
  }
  console.log('[Auth] User found:', currentUser.email);

  // 4) Check if user account is active
  if (!currentUser.active) {
    console.warn('[Auth] User account deactivated:', currentUser.email);
    return next(new ApiError("User account is deactivated", 401));
  }

  // 5) Check if user is banned
  if (currentUser.isBanned) {
    console.warn('[Auth] User account banned:', currentUser.email);
    return next(new ApiError("User account is banned", 403));
  }

  // 6) Check if user changed password after token was issued
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    
    if (passChangedTimestamp > decoded.iat) {
      console.warn('[Auth] Password changed after token issued:', currentUser.email);
      return next(
        new ApiError(
          "User recently changed password. Please login again.",
          401
        )
      );
    }
  }

  // 7) Attach user to request and continue
  req.user = currentUser;
  console.log('[Auth] User authenticated:', currentUser.email);
  next();
});

// @desc Authorization (User Permissions)
// @desc Authorization (User Permissions)
exports.allowedTo = (...roles) => {
  return async (req, res, next) => {
    try {
      // ✅ استثناء مسارات الدفع (تسمح لأي مستخدم مسجل)
      if (req.originalUrl && req.originalUrl.includes('/payment/')) {
        return next();
      }
      
      if (req.user.role === 'super_admin') {
        return next();
      }
      
      // 1) access roles
      // 2) access registered user (req.user.role)
      if (!roles.includes(req.user.role)) {
        return next(
          new ApiError('You are not allowed to access this route', 403)
        );
      }
      next();
    } catch (error) {
      console.error('[Auth] Error in allowedTo middleware:', error.message);
      return next(new ApiError('Authorization failed', 500));
    }
  };
};

// @desc    Forgot password
// @route   Post /api/v1/auth/forgotPassword
// @access  Public
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }

  // 2) If user exist, Generate hash resetrandom 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Save password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
  // 3) Send the reset code via email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset code (valid for 10 min)',
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError('There is an error in sending email', 500));
  }
  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {

  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ApiError("Reset code invalid or expired", 400));
  }

  user.passwordResetVerified = true;

  await user.save();

  res.status(200).json({
    status: "success"
  });

});


  // @desc    Reset password
// @route   POST /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ApiError(`There is no user with email ${req.body.email}`, 404));
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError('Reset code not verified', 400));
  }

  user.password = req.body.newPassword;

  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();


  await RefreshToken.deleteMany({ user: user._id });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = await createAndStoreRefreshToken(user._id);

  res.status(200).json({
    status: "success",
    tokens: {
      accessToken,
      refreshToken,
    },
  });
});


// @desc Logout
// @route POST /api/v1/auth/logout
// @access Private
exports.logout = asyncHandler(async (req, res, next) => {
  const refreshToken = req.body?.refreshToken;

  if (!refreshToken) {
    return next(new ApiError("Refresh token required", 400));
  }

  // ✅ التأكد إن التوكن ده تبع المستخدم نفسه
  const deletedToken = await RefreshToken.findOneAndDelete({ 
    token: refreshToken,
    user: req.user._id  // 🔥 شرط مهم!
  });

  if (!deletedToken) {
    return next(new ApiError("Invalid refresh token", 400));
  }

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

// @desc Logout from all devices
// @route POST /api/v1/auth/logoutAll
// @access Private
exports.logoutAllDevices = asyncHandler(async (req, res, next) => {
  await RefreshToken.deleteMany({ user: req.user._id });

  res.status(200).json({
    status: "success",
    message: "Logged out from all devices successfully",
  });
});