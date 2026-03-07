const Lesson = require('../models/lessonModel');
const Section = require('../models/sectionModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

const lessonFactory = factory(Lesson, 'Lesson');

exports.getLessons = lessonFactory.getAll;
exports.getLesson = lessonFactory.getOne;
exports.updateLesson = lessonFactory.updateOne;
exports.deleteLesson = lessonFactory.deleteOne;

// ✅ إنشاء درس (موحد للعربي والكيمياء)
exports.createLesson = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.body.sectionId);
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  const lesson = await Lesson.create(req.body);

  res.status(201).json({
    status: 'success',
    data: lesson,
  });
});

// ✅ جلب دروس قسم معين
exports.getLessonsBySection = asyncHandler(async (req, res, next) => {
  const { sectionId } = req.params;

  const section = await Section.findById(sectionId);
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 50;
  const skip = (page - 1) * limit;

  const lessons = await Lesson.find({ sectionId, isActive: true })
    .skip(skip)
    .limit(limit)
    .sort({ order: 1 });

  const total = await Lesson.countDocuments({ sectionId });

  res.status(200).json({
    status: 'success',
    results: lessons.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    },
    data: lessons,
  });
});

exports.toggleLessonStatus = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  lesson.isActive = !lesson.isActive;
  await lesson.save();

  res.status(200).json({
    status: 'success',
    message: `Lesson ${lesson.isActive ? 'activated' : 'deactivated'} successfully`,
    data: lesson,
  });
});

exports.reorderLessons = asyncHandler(async (req, res, next) => {
  const { lessons } = req.body;

  const bulkOps = lessons.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order },
    },
  }));

  await Lesson.bulkWrite(bulkOps);

  res.status(200).json({
    status: 'success',
    message: 'Lessons reordered successfully',
  });
});

exports.getLessonContent = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: lesson,
  });
});