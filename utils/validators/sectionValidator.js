const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Subject = require('../../models/subjectModel');
const Section = require('../../models/sectionModel');

/**
 * التحقق من إنشاء قسم جديد
 */
exports.createSectionValidator = [
  check('name')
    .notEmpty()
    .withMessage('Section name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Section name must be between 3 and 100 characters')
    .custom(async (name, { req }) => {
      // التحقق من عدم تكرار الاسم داخل نفس المادة
      const existingSection = await Section.findOne({ 
        name,
        subjectId: req.body.subjectId 
      });
      
      if (existingSection) {
        throw new Error(`Section with name "${name}" already exists in this subject`);
      }
      
      return true;
    }),

  check('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid Subject ID format')
    .custom(async (subjectId) => {
      // التحقق من وجود المادة
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        throw new Error('Subject not found');
      }
      
      // التحقق من أن المادة تقبل أقسام
      if (!subject.hasSections) {
        throw new Error(`Subject "${subject.name}" does not support sections`);
      }
      
      return true;
    }),

  check('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),

  check('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),

  validatorMiddleware,
];

/**
 * التحقق من جلب قسم واحد
 */
exports.getSectionValidator = [
  check('id').isMongoId().withMessage('Invalid Section ID format'),
  validatorMiddleware,
];

/**
 * التحقق من جلب دروس قسم معين
 */
exports.getSectionLessonsValidator = [
  check('id').isMongoId().withMessage('Invalid Section ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تحديث قسم
 */
exports.updateSectionValidator = [
  check('id').isMongoId().withMessage('Invalid Section ID format'),

  check('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .custom(async (name, { req }) => {
      // لو غير الاسم، نتأكد إنه مش مكرر في نفس المادة
      // هنحتاج نجيب القسم الأول عشان نشوف subjectId بتاعه
      const section = await Section.findById(req.params.id);
      if (!section) {
        throw new Error('Section not found');
      }
      
      const existingSection = await Section.findOne({
        name,
        subjectId: section.subjectId,
        _id: { $ne: req.params.id }
      });
      
      if (existingSection) {
        throw new Error(`Section with name "${name}" already exists in this subject`);
      }
      
      return true;
    }),

  check('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),

  check('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),

  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  validatorMiddleware,
];

/**
 * التحقق من حذف قسم
 */
exports.deleteSectionValidator = [
  check('id').isMongoId().withMessage('Invalid Section ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تبديل حالة القسم (تفعيل/تعطيل)
 */
exports.toggleSectionValidator = [
  check('id').isMongoId().withMessage('Invalid Section ID format'),
  validatorMiddleware,
];