const Subject = require('../models/subjectModel');
const Section = require('../models/sectionModel');
const Lesson = require('../models/lessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

// استخدام factory للـ CRUD الأساسي
const subjectFactory = factory(Subject, 'Subject');

// ==================== دوال CRUD الأساسية ====================
// @desc    Create subject
// @route   POST /api/v1/subjects
// @access  Private/SuperAdmin
exports.createSubject = asyncHandler(async (req, res, next) => {
  // 1) التحقق من أن السوبر أدمن هو اللي بيعمل كده
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new ApiError('Only super admins can create subjects', 403));
  }

  // 2) ✅ التحقق من عدم وجود أي مادة مسبقًا
  const existingSubject = await Subject.findOne({});
  if (existingSubject) {
    return next(new ApiError('A subject already exists. You cannot create more than one subject.', 400));
  }

  // 3) إنشاء المادة
  const subject = await Subject.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Subject created successfully',
    data: subject
  });
});

exports.getSubjects = subjectFactory.getAll;
exports.getSubject = subjectFactory.getOne;

// @desc    Update subject
// @route   PUT /api/v1/subjects/:id
// @access  Private/Admin
exports.updateSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  
  if (!subject) {
    return next(new ApiError('Subject not found', 404));
  }
  
  // لو بيحاول يغير hasSections
  if (req.body.hasSections !== undefined && req.body.hasSections !== subject.hasSections) {
    
    if (subject.hasSections) {
      // الموضوع كان بيقبل أقسام وبيقوله لأ
      const sectionsCount = await Section.countDocuments({ subjectId: subject._id });
      if (sectionsCount > 0) {
        return next(new ApiError(
          `Cannot change hasSections to false because ${sectionsCount} section(s) already exist`, 
          400
        ));
      }
    } else {
      // الموضوع كان مش بيقبل أقسام وبيقوله أيوه
      const lessonsCount = await Lesson.countDocuments({ subjectId: subject._id });
      if (lessonsCount > 0) {
        return next(new ApiError(
          `Cannot change hasSections to true because ${lessonsCount} lesson(s) already exist under the subject directly`,
          400
        ));
      }
    }
  }
  
  const updatedSubject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: updatedSubject
  });
});

exports.updateSubject = subjectFactory.updateOne;
exports.deleteSubject = subjectFactory.deleteOne;

// ==================== دوال إضافية ====================

// @desc    Toggle subject active status
// @route   PATCH /api/v1/subjects/:id/toggle
// @access  Private/Admin
exports.toggleSubjectStatus = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  
  if (!subject) {
    return next(new ApiError('Subject not found', 404));
  }

  subject.isActive = !subject.isActive;
  await subject.save();

  res.status(200).json({
    status: 'success',
    message: `Subject ${subject.isActive ? 'activated' : 'deactivated'} successfully`,
    data: subject,
  });
});

// @desc    Get full structure of a subject (with its sections and lessons)
// @route   GET /api/v1/subjects/:id/structure
// @access  Private
exports.getSubjectStructure = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  
  if (!subject) {
    return next(new ApiError('Subject not found', 404));
  }

  let structure = {
    subject,
    content: []
  };

  if (subject.hasSections) {
    // لو المادة ليها أقسام (زي العربي)
    const sections = await Section.find({ subjectId: subject._id }).sort({ order: 1 });
    
    // نجيب الدروس لكل قسم
    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await Lesson.find({ sectionId: section._id })
          .sort({ order: 1 })
          .select('-content.text'); // مختصرين المحتوى عشان الـ response ميقلش
          
        return {
          ...section.toObject(),
          lessons
        };
      })
    );
    
    structure.content = sectionsWithLessons;
  } else {
    // لو المادة مالهاش أقسام (زي الكيمياء)
    const lessons = await Lesson.find({ subjectId: subject._id })
      .sort({ order: 1 })
      .select('-content.text');
      
    structure.content = lessons;
  }

  res.status(200).json({
    status: 'success',
    data: structure
  });
});