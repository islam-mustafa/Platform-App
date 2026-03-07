const Section = require('../models/sectionModel');
const Subject = require('../models/subjectModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

// ✅ استخدام factory للـ CRUD الأساسي
const sectionFactory = factory(Section, 'Section');

// ==================== التحقق المخصص ====================

// @desc    Create section (مع التحقق)
// @route   POST /api/v1/sections
// @access  Private/Admin
exports.createSection = asyncHandler(async (req, res, next) => {
  // 1) التحقق من وجود المادة
  const subject = await Subject.findById(req.body.subjectId);
  if (!subject) {
    return next(new ApiError('Subject not found', 404));
  }

  // 2) التحقق من أن المادة تقبل أقسام
  if (!subject.hasSections) {
    return next(new ApiError(
      `Cannot add sections to subject "${subject.name}" because it does not support sections`,
      400
    ));
  }

  // 3) إنشاء القسم
  const section = await Section.create(req.body);

  res.status(201).json({
    status: 'success',
    data: section
  });
});

// ==================== دوال CRUD الأساسية من factory ====================
exports.getSections = sectionFactory.getAll;
exports.getSection = sectionFactory.getOne;
exports.updateSection = sectionFactory.updateOne;
exports.deleteSection = sectionFactory.deleteOne;

// ==================== دوال إضافية ====================

// @desc    Toggle section active status
// @route   PATCH /api/v1/sections/:id/toggle
// @access  Private/Admin
exports.toggleSectionStatus = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.params.id);
  
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  section.isActive = !section.isActive;
  await section.save();

  res.status(200).json({
    status: 'success',
    message: `Section ${section.isActive ? 'activated' : 'deactivated'} successfully`,
    data: section,
  });
});

// @desc    Get lessons by section ID
// @route   GET /api/v1/sections/:id/lessons
// @access  Private
exports.getSectionLessons = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.params.id);
  
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  const Lesson = require('../models/lessonModel');
  const lessons = await Lesson.find({ sectionId: section._id })
    .sort({ order: 1 })
    .select('-content.text');

  res.status(200).json({
    status: 'success',
    results: lessons.length,
    data: lessons
  });
});