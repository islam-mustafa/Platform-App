const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Subject = require('../../models/subjectModel');

/**
 * التحقق من إنشاء مادة جديدة
 */
exports.createSubjectValidator = [
  check('name')
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Subject name must be between 3 and 100 characters')
    .custom(async (name) => {
      const subject = await Subject.findOne({ name });
      if (subject) {
        throw new Error(`Subject with name "${name}" already exists`);
      }
      return true;
    }),

  check('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('hasSections')
    .optional()
    .isBoolean()
    .withMessage('hasSections must be a boolean value'),

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
 * التحقق من جلب مادة واحدة
 */
exports.getSubjectValidator = [
  check('id').isMongoId().withMessage('Invalid Subject ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تحديث مادة
 */
exports.updateSubjectValidator = [
  check('id').isMongoId().withMessage('Invalid Subject ID format'),

  check('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .custom(async (name, { req }) => {
      // لو غير الاسم، نتأكد إنه مش مكرر
      const existingSubject = await Subject.findOne({
        name,
        _id: { $ne: req.params.id } // استثني نفس المادة
      });
      if (existingSubject) {
        throw new Error(`Subject with name "${name}" already exists`);
      }
      return true;
    }),

  check('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('hasSections')
    .optional()
    .isBoolean()
    .withMessage('hasSections must be a boolean value'),

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
 * التحقق من حذف مادة
 */
exports.deleteSubjectValidator = [
  check('id').isMongoId().withMessage('Invalid Subject ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تبديل حالة المادة (تفعيل/تعطيل)
 */
exports.toggleSubjectValidator = [
  check('id').isMongoId().withMessage('Invalid Subject ID format'),
  validatorMiddleware,
];