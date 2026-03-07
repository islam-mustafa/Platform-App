const Subject = require('../models/subjectModel');
const Section = require('../models/sectionModel');
const Lesson = require('../models/lessonModel');
const Grade = require('../models/gradeModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');
const { ROLES } = require('../utils/constants');

const subjectFactory = factory(Subject, 'Subject');

exports.getSubjects = subjectFactory.getAll;
exports.getSubject = subjectFactory.getOne;
exports.updateSubject = subjectFactory.updateOne;
exports.deleteSubject = subjectFactory.deleteOne;

// ✅ إنشاء مادة جديدة (تدعم العربي والكيمياء)
exports.createSubject = asyncHandler(async (req, res, next) => {
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new ApiError('Only super admins can create subjects', 403));
  }

  const existingSubject = await Subject.findOne({});
  if (existingSubject) {
    return next(new ApiError('A subject already exists. You cannot create more than one subject.', 400));
  }

  // 1) إنشاء المادة
  const subject = await Subject.create(req.body);

  // 2) ✅ إذا كانت المادة ليس لها أقسام (زي الكيمياء)، أنشئ أقسامًا افتراضية لكل صف
  if (!subject.hasSections) {
    const grades = await Grade.find({ isActive: true });
    
    const defaultSections = grades.map(grade => ({
      name: `${subject.name} - ${grade.name}`,
      subjectId: subject._id,
      gradeId: grade._id,
      description: subject.description,
      order: grade.order,
      isDefault: true,
      isActive: true
    }));
    
    if (defaultSections.length > 0) {
      await Section.insertMany(defaultSections);
    }
  }

  res.status(201).json({
    status: 'success',
    message: 'Subject created successfully',
    data: subject
  });
});

// ✅ جلب هيكل المادة الكامل (يدعم الحالتين)
exports.getSubjectStructure = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  
  if (!subject) {
    return next(new ApiError('Subject not found', 404));
  }

  // جلب جميع الأقسام الخاصة بالمادة
  const sections = await Section.find({ 
    subjectId: subject._id,
    isActive: true 
  }).sort({ order: 1 });

  // جلب الدروس لكل قسم
  const sectionsWithLessons = await Promise.all(
    sections.map(async (section) => {
      const lessons = await Lesson.find({ 
        sectionId: section._id,
        isActive: true 
      }).sort({ order: 1 });
      
      return {
        ...section.toObject(),
        lessons,
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      subject,
      sections: sectionsWithLessons,
    },
  });
});

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