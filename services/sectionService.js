const Section = require('../models/sectionModel');
const Lesson = require('../models/lessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

// ✅ أضف { hideInactive: true } عشان الفلتر يشتغل
const sectionFactory = factory(Section, 'Section', { 
  hideInactive: true,
  cascade: [
    { model: Lesson, filter: 'sectionId', message: 'lessons' }
  ]
});
// ==================== من الـ factory ====================
exports.getSections = sectionFactory.getAll;  // دلوقتي هيفلتر تلقائيًا
exports.getSection = sectionFactory.getOne;   // دلوقتي هيفلتر تلقائيًا
exports.updateSection = sectionFactory.updateOne;

// ==================== الدوال المخصصة ====================

// ✅ إنشاء قسم (للمواد اللي ليها أقسام فقط)
exports.createSection = asyncHandler(async (req, res, next) => {
  const Subject = require('../models/subjectModel');
  const Grade = require('../models/gradeModel');
  const Section = require('../models/sectionModel');
  
  // 1) التحقق من وجود المادة
  const subject = await Subject.findById(req.body.subjectId);
  if (!subject) {
    return next(new ApiError('Subject not found', 404));
  }

  // 2) ✅ منع إضافة أقسام للمواد اللي ملهاش أقسام
  if (!subject.hasSections) {
    return next(new ApiError(
      `Cannot add sections to subject "${subject.name}" because it does not support multiple sections. This subject already has a default section.`,
      400
    ));
  }

  // 3) التحقق من وجود الصف
  const grade = await Grade.findById(req.body.gradeId);
  if (!grade) {
    return next(new ApiError('Grade not found', 404));
  }

  // 4) ✅ التأكد من عدم وجود قسم بنفس الاسم لنفس المادة والصف
  const existingSection = await Section.findOne({
    name: req.body.name,
    subjectId: req.body.subjectId,
    gradeId: req.body.gradeId
  });

  if (existingSection) {
    return next(new ApiError('Section with this name already exists for this subject and grade', 400));
  }

  // 5) إنشاء القسم
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

// ✅ تبديل حالة القسم
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

// ✅ إعادة ترتيب الأقسام (للمواد اللي ليها أقسام فقط)
exports.reorderSections = asyncHandler(async (req, res, next) => {
  const { sections } = req.body;
  
  // 1) نجيب أول قسم عشان نشوف المادة التابعة ليها
  const firstSection = await Section.findById(sections[0].id).populate('subjectId');
  if (!firstSection) {
    return next(new ApiError('Section not found', 404));
  }

  // 2) نتأكد إن المادة دي أصلًا ليها أقسام
  if (!firstSection.subjectId.hasSections) {
    return next(new ApiError(
      `Cannot reorder sections for subject "${firstSection.subjectId.name}" because it does not support multiple sections`,
      400
    ));
  }

  // 3) نتأكد إن كل الأقسام اللي بنعيد ترتيبها تابعة لنفس المادة
  const subjectId = firstSection.subjectId._id;
  for (const item of sections) {
    const section = await Section.findById(item.id).populate('subjectId');
    if (!section || section.subjectId._id.toString() !== subjectId.toString()) {
      return next(new ApiError('All sections must belong to the same subject', 400));
    }
  }

  // 4) تنفيذ إعادة الترتيب
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