const Grade = require('../models/gradeModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');
const { ROLES } = require('../utils/constants');

// استخدام factory للـ CRUD الأساسي
const gradeFactory = factory(Grade, 'Grade');

// ==================== دوال CRUD الأساسية ====================
exports.getGrades = gradeFactory.getAll;
exports.getGrade = gradeFactory.getOne;
exports.updateGrade = gradeFactory.updateOne;
exports.deleteGrade = gradeFactory.deleteOne;

// ==================== إنشاء صف جديد (مخصص) ====================
exports.createGrade = asyncHandler(async (req, res, next) => {
  // التحقق من أن السوبر أدمن هو اللي بيعمل كده
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new ApiError('Only super admins can create grades', 403));
  }

  // إنشاء الصف
  const grade = await Grade.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Grade created successfully',
    data: grade,
  });
});

// ==================== دوال إضافية ====================
exports.toggleGradeStatus = asyncHandler(async (req, res, next) => {
  const grade = await Grade.findById(req.params.id);
  
  if (!grade) {
    return next(new ApiError('Grade not found', 404));
  }

  grade.isActive = !grade.isActive;
  await grade.save();

  res.status(200).json({
    status: 'success',
    message: `Grade ${grade.isActive ? 'activated' : 'deactivated'} successfully`,
    data: grade,
  });
});