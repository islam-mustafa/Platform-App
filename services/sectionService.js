const Section = require('../models/sectionModel');
const Lesson = require('../models/lessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

const sectionFactory = factory(Section, 'Section');

exports.getSections = sectionFactory.getAll;
exports.getSection = sectionFactory.getOne;
exports.updateSection = sectionFactory.updateOne;

// ✅ إنشاء قسم (للمواد اللي ليها أقسام فقط)
exports.createSection = asyncHandler(async (req, res, next) => {
  const Subject = require('../models/subjectModel');
  const Grade = require('../models/gradeModel');
  
  const subject = await Subject.findById(req.body.subjectId);
  if (!subject) {
    return next(new ApiError('Subject not found', 404));
  }

  // ✅ منع إضافة أقسام للمواد اللي ملهاش أقسام
  if (!subject.hasSections) {
    return next(new ApiError(
      `Cannot add sections to subject "${subject.name}" because it does not support sections. This subject uses automatic sections per grade.`,
      400
    ));
  }

  const grade = await Grade.findById(req.body.gradeId);
  if (!grade) {
    return next(new ApiError('Grade not found', 404));
  }

  const section = await Section.create(req.body);

  res.status(201).json({
    status: 'success',
    data: section,
  });
});

// ✅ حذف قسم
exports.deleteSection = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.params.id);
  
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  if (section.isDefault) {
    return next(new ApiError('Cannot delete default section', 400));
  }

  await Lesson.deleteMany({ sectionId: section._id });
  await Section.findByIdAndDelete(req.params.id);

  res.status(204).send();
});

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

exports.reorderSections = asyncHandler(async (req, res, next) => {
  const { sections } = req.body;

  const bulkOps = sections.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order },
    },
  }));

  await Section.bulkWrite(bulkOps);

  res.status(200).json({
    status: 'success',
    message: 'Sections reordered successfully',
  });
});