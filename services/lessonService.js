const Lesson = require('../models/lessonModel');
const Section = require('../models/sectionModel');
const StudentLesson = require('../models/studentLessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

const lessonFactory = factory(Lesson, 'Lesson', { 
  hideInactive: true,
  
  // ✅ دالة مخصصة لمعالجة المستند قبل الرد في getOne
  processOne: async (req, res, doc) => {
    // للمستخدم العادي
    if (req.user && req.user.role === 'user') {
      doc = doc.toObject();
      
      if (doc.isPremium) {
        delete doc.content;
      } else {
        if (doc.content) {
          delete doc.content.text;
        }
      }
    }
    res.status(200).json({ status: 'success', data: doc });
  },
  
  // ✅ دالة مخصصة لمعالجة المصفوفة قبل الرد في getAll
  processMany: async (req, res, docs) => {
    // للمستخدم العادي
  console.log('=================================');
  console.log('processMany called for', docs.length, 'lessons');
  console.log('User role:', req.user?.role);
  
  // للمستخدم العادي
  if (req.user && req.user.role === 'user') {
    docs = docs.map(doc => {
      console.log('Before:', doc._id, 'isPremium:', doc.isPremium);
      
      doc = doc.toObject();
      
      if (doc.isPremium) {
        console.log('  → Premium lesson, deleting all content');
        delete doc.content;
      } else {
        if (doc.content) {
          console.log('  → Free lesson, deleting text only');
          delete doc.content.text;
        }
      }
      
      return doc;
    });
  }
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs,
    });
  }
}); 

// ✅ أضف هذا القوس هنا

// ==================== دوال مخصصة ====================

// ✅ إنشاء درس
exports.createLesson = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.body.sectionId);
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  const lesson = await Lesson.create(req.body);
  res.status(201).json({ status: 'success', data: lesson });
});

// ✅ جلب محتوى درس كامل (للمستخدم)
exports.getLessonContent = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  if (!lesson.isActive) {
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return res.status(200).json({ 
        data: lesson,
        warning: 'This lesson is inactive (hidden from regular users)'
      });
    }
    return next(new ApiError('Lesson not found', 404));
  }

  if (!lesson.isPremium) {
    return res.status(200).json({ data: lesson });
  }

  const studentLesson = await StudentLesson.findOne({
    userId: req.user._id,
    lessonId: lesson._id,
    hasAccess: true
  });

  if (!studentLesson) {
    return next(new ApiError('You need to purchase this lesson first', 403));
  }

  res.status(200).json({ data: lesson });
});

// ✅ جلب دروس قسم معين
exports.getLessonsBySection = asyncHandler(async (req, res, next) => {
  const { sectionId } = req.params;

  const section = await Section.findById(sectionId);
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  let filter = { sectionId };
  if (req.user.role === 'user') {
    filter.isActive = true;
  }

  const lessons = await Lesson.find(filter).sort({ order: 1 });

  if (req.user.role === 'user') {
    lessons.forEach(lesson => {
      if (lesson.isPremium) {
        lesson.content = undefined;
      } else if (lesson.content) {
        lesson.content.text = undefined;
      }
    });
  }

  res.status(200).json({
    status: 'success',
    results: lessons.length,
    data: lessons,
  });
});

// ✅ تحديث درس
exports.updateLesson = asyncHandler(async (req, res, next) => {
  if (req.body.isPremium === false && req.body.price && req.body.price > 0) {
    return next(new ApiError('Free lessons cannot have a price', 400));
  }

  const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  res.status(200).json({ status: 'success', data: lesson });
});

// ✅ شراء درس
exports.purchaseLesson = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson || !lesson.isPremium) {
    return next(new ApiError('Lesson not available for purchase', 404));
  }

  const existing = await StudentLesson.findOne({
    userId: req.user._id,
    lessonId: lesson._id
  });

  if (existing?.hasAccess) {
    return next(new ApiError('You already own this lesson', 400));
  }

  await StudentLesson.findOneAndUpdate(
    { userId: req.user._id, lessonId: lesson._id },
    { 
      hasAccess: true,
      purchaseDate: new Date(),
      purchasePrice: lesson.price,
      purchaseCurrency: lesson.currency || 'EGP'
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Lesson purchased successfully'
  });
});

// ✅ تبديل حالة الدرس
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

// ✅ إعادة ترتيب الدروس
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

// ==================== استخدام factory للدوال الأساسية ====================
exports.getLessons = lessonFactory.getAll; // ✅ استخدم factory مباشرة
exports.getLesson = lessonFactory.getOne;
exports.deleteLesson = lessonFactory.deleteOne;