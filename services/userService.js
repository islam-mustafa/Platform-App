const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');
const { ROLES, ALLOWED_UPDATES, EXCLUDED_FIELDS } = require('../utils/constants');
const { factory } = require('./baseService');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const { sanitizeUser } = require('../utils/sanitizeData');
const User = require('../models/userModel');

// ✅ إنشاء factory للمستخدم
const userFactory = factory(User, 'User');

// ==================== الصور ====================

// Upload single image
exports.uploadUserImage = uploadSingleImage('profileImg');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  console.log('🔍 req.file:', req.file);
  console.log('🔍 req.file.buffer:', req.file?.buffer);
  if (!req.file) return next();

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'users/profile',
          public_id: `user-${uuidv4()}-${Date.now()}`,
          transformation: [
            { width: 600, height: 600, crop: 'limit' },
            { quality: 'auto:good' }
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      const streamifier = require('streamifier');
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    req.body.profileImg = result.secure_url;
    console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
    next();
    
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    return next(new ApiError('Error uploading image to Cloudinary', 500));
  }
});

// ==================== المستخدم الحالي ====================

// @desc    Get logged-in user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new ApiError('User not found', 404));

  res.status(200).json({
    status: 'success',
    data: sanitizeUser(user),
  });
});

// @desc    Delete logged-in user profile image
// @route   DELETE /api/v1/users/me/image
// @access  Private
exports.deleteMyImage = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user || !user.profileImg) {
    return next(new ApiError('No image found to delete', 404));
  }

  console.log('🔍 Full URL:', user.profileImg);

  try {
    const urlParts = user.profileImg.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new Error('Not a Cloudinary URL');
    }
    
    const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithVersion.split('.')[0];
    
    console.log('🔍 Public ID to delete:', publicId);

    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Cloudinary delete result:', result);

    if (result.result !== 'ok') {
      return next(new ApiError(`Failed to delete image from Cloudinary: ${result.result}`, 500));
    }

    user.profileImg = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Profile image deleted successfully',
      data: sanitizeUser(user),
    });

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return next(new ApiError(`Error deleting image: ${error.message}`, 500));
  }
});

// @desc    Update logged-in user profile
// @route   PUT /api/v1/users/me
// @access  Private
exports.updateMe = asyncHandler(async (req, res, next) => {
  const allowedUpdates = ['name', 'phone', 'parentPhone', 'profileImg'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.body.email) {
    return next(new ApiError('Email cannot be changed through this endpoint', 400));
  }

  if (Object.keys(updates).length === 0) {
    return next(new ApiError('No valid fields to update', 400));
  }

  const currentUser = await User.findById(req.user._id);
  
  let hasChanges = false;
  const changes = {};
  
  for (const [key, value] of Object.entries(updates)) {
    if (currentUser[key] !== value) {
      hasChanges = true;
      changes[key] = { from: currentUser[key], to: value };
    }
  }

  if (!hasChanges) {
    return res.status(200).json({
      status: 'success',
      message: 'No changes detected - your data is already up to date',
      data: sanitizeUser(currentUser)
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id, 
    updates, 
    { new: true, runValidators: true }
  );

  console.log(`User ${user.email} updated fields:`, changes);

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: sanitizeUser(user)
  });
});

// @desc    Update logged-in user profile with image
// @route   PUT /api/v1/users/me/image
// @access  Private
exports.updateMeWithImage = asyncHandler(async (req, res, next) => {
  const allowedUpdates = ['name', 'phone', 'parentPhone', 'profileImg'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.body.email) {
    return next(new ApiError('Email cannot be changed through this endpoint', 400));
  }

  if (Object.keys(updates).length === 0) {
    return next(new ApiError('No valid fields to update', 400));
  }

  if (updates.profileImg) {
    const user = await User.findById(req.user._id);
    if (user?.profileImg) {
      const oldPath = path.join(process.cwd(), 'uploads', 'users', user.profileImg);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: sanitizeUser(updatedUser),
  });
});

// @desc    Change logged-in user password
// @route   PUT /api/v1/users/me/change-password
// @access  Private
exports.changeMyPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new ApiError('User not found', 404));

  const isCorrect = await bcrypt.compare(req.body.currentPassword, user.password);
  if (!isCorrect) {
    return next(new ApiError('Current password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully',
  });
});

// @desc    Deactivate logged-in user account
// @route   DELETE /api/v1/users/me
// @access  Private
exports.deactivateMe = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).send();
});

// ==================== ✅ استخدام factory لعمليات CRUD الأساسية ====================

// @desc    Get all users with pagination
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  const apiFeatures = new ApiFeatures(User.find(), req.query)
    .paginate(count)
    .filter()
    .search('Users')
    .limitFields()
    .sort();

  const users = await apiFeatures.mongooseQuery.select(EXCLUDED_FIELDS);

  res.status(200).json({
    status: 'success',
    results: users.length,
    paginationResult: apiFeatures.paginationResult,
    data: users,
  });
});

// ✅ استخدام factory للدوال الأساسية
exports.getUser = userFactory.getOne;
exports.createUser = userFactory.createOne;
exports.updateUser = userFactory.updateOne;
exports.deleteUser = userFactory.deleteOne;

// ==================== دوال الحظر ====================

// @desc    Ban user
// @route   PATCH /api/v1/users/:id/ban
// @access  Private/Admin
exports.banUser = asyncHandler(async (req, res, next) => {
  const userToBan = await User.findById(req.params.id);

  if (!userToBan) {
    return next(new ApiError('User not found', 404));
  }

  // 1) منع حظر النفس
  if (userToBan._id.toString() === req.user._id.toString()) {
    return next(new ApiError('You cannot ban yourself', 400));
  }

  // 2) منع حظر السوبر أدمن (لأي حد)
  if (userToBan.role === ROLES.SUPER_ADMIN) {
    return next(new ApiError('You cannot ban a super admin', 403));
  }

  // 3) منع الأدمن العادي من حظر أدمن تاني
  if (userToBan.role === ROLES.ADMIN && req.user.role === ROLES.ADMIN) {
    return next(new ApiError('Admins cannot ban other admins', 403));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: true, bannedAt: Date.now() },
    { new: true }
  ).select(EXCLUDED_FIELDS);

  res.status(200).json({ 
    status: 'success', 
    message: 'User banned successfully',
    data: user 
  });
});

// @desc    Unban user
// @route   PATCH /api/v1/users/:id/unban
// @access  Private/Admin
exports.unbanUser = asyncHandler(async (req, res, next) => {
  const userToUnban = await User.findById(req.params.id);

  if (!userToUnban) {
    return next(new ApiError('User not found', 404));
  }

  // 1) منع إلغاء حظر النفس
  if (userToUnban._id.toString() === req.user._id.toString()) {
    return next(new ApiError('You cannot unban yourself', 400));
  }

  // 2) منع إلغاء حظر السوبر أدمن (لأي حد)
  if (userToUnban.role === ROLES.SUPER_ADMIN) {
    return next(new ApiError('You cannot unban a super admin', 403));
  }

  // 3) منع الأدمن العادي من إلغاء حظر أدمن تاني
  if (userToUnban.role === ROLES.ADMIN && req.user.role === ROLES.ADMIN) {
    return next(new ApiError('Admins cannot unban other admins', 403));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: false, bannedAt: undefined },
    { new: true }
  ).select(EXCLUDED_FIELDS);

  res.status(200).json({ 
    status: 'success', 
    message: 'User unbanned successfully',
    data: user 
  });
});

// ✅ دالة Toggle Ban (جديدة)
// @desc    Toggle user ban status
// @route   PATCH /api/v1/users/:id/toggle-ban
// @access  Private/Admin
// @desc    Toggle user ban status
// @route   PATCH /api/v1/users/:id/toggle-ban
// @access  Private/Admin
exports.toggleBanUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // 1️⃣ منع حظر النفس
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ApiError('You cannot ban yourself', 400));
  }

  // 2️⃣ منع حظر السوبر أدمن (لأي حد مش سوبر أدمن)
  if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new ApiError('You cannot ban a super admin', 403));
  }

  // 3️⃣ ✅ منع الأدمن العادي من حظر أدمن تاني
  if (user.role === ROLES.ADMIN && req.user.role === ROLES.ADMIN) {
    return next(new ApiError('Admins cannot ban other admins', 403));
  }

  // 4️⃣ ✅ منع الأدمن العادي من حظر سوبر أدمن (تأمين إضافي)
  if (user.role === ROLES.SUPER_ADMIN && req.user.role === ROLES.ADMIN) {
    return next(new ApiError('Admins cannot ban super admins', 403));
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { 
      isBanned: !user.isBanned,
      bannedAt: user.isBanned ? undefined : Date.now()
    },
    { new: true }
  ).select(EXCLUDED_FIELDS);

  res.status(200).json({
    status: 'success',
    message: user.isBanned ? 'User unbanned successfully' : 'User banned successfully',
    data: updatedUser
  });
});

// ==================== دوال إدارة الأدمن (للسوبر أدمن فقط) ====================

// ✅ دالة إنشاء أدمن (للسوبر أدمن فقط)
// @desc    Create admin user
// @route   POST /api/v1/users/admin
// @access  Private/SuperAdmin
exports.createAdmin = asyncHandler(async (req, res, next) => {
  // السوبر أدمن فقط
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new ApiError('Only super admins can create new admins', 403));
  }

  const user = await User.create({
    ...req.body,
    role: ROLES.ADMIN,
    emailVerified: true,
  });

  res.status(201).json({ 
    status: 'success', 
    message: 'Admin created successfully',
    data: sanitizeUser(user) 
  });
});

// ✅ دالة حذف أدمن (للسوبر أدمن فقط)
// @desc    Delete admin user
// @route   DELETE /api/v1/users/admin/:id
// @access  Private/SuperAdmin
exports.deleteAdmin = asyncHandler(async (req, res, next) => {
  // السوبر أدمن فقط
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new ApiError('Only super admins can delete admins', 403));
  }

  const userToDelete = await User.findById(req.params.id);
  
  if (!userToDelete) {
    return next(new ApiError('User not found', 404));
  }

  // منع حذف السوبر أدمن
  if (userToDelete.role === ROLES.SUPER_ADMIN) {
    return next(new ApiError('Cannot delete a super admin', 403));
  }

  // منع حذف آخر أدمن
  const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
  if (adminCount <= 1 && userToDelete.role === ROLES.ADMIN) {
    return next(new ApiError('Cannot delete the last admin', 403));
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
});