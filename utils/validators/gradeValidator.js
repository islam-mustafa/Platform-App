const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Grade = require('../../models/gradeModel');

/**
 * التحقق من إنشاء صف جديد
 */
exports.createGradeValidator = [
  check('name')
    .notEmpty()
    .withMessage('Grade name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Grade name must be between 3 and 100 characters')
    .custom(async (name) => {
      const grade = await Grade.findOne({ name });
      if (grade) {
        throw new Error(`Grade with name "${name}" already exists`);
      }
      return true;
    }),

  check('level')
    .notEmpty()
    .withMessage('Grade level is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12')
    .custom(async (level) => {
      const grade = await Grade.findOne({ level });
      if (grade) {
        throw new Error(`Grade with level ${level} already exists`);
      }
      return true;
    }),

  check('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),

  validatorMiddleware,
];

/**
 * التحقق من جلب صف واحد
 */
exports.getGradeValidator = [
  check('id').isMongoId().withMessage('Invalid Grade ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تحديث صف
 */
exports.updateGradeValidator = [
  check('id').isMongoId().withMessage('Invalid Grade ID format'),

  check('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .custom(async (name, { req }) => {
      const existingGrade = await Grade.findOne({
        name,
        _id: { $ne: req.params.id }
      });
      if (existingGrade) {
        throw new Error(`Grade with name "${name}" already exists`);
      }
      return true;
    }),

  check('level')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Level must be between 1 and 12')
    .custom(async (level, { req }) => {
      const existingGrade = await Grade.findOne({
        level,
        _id: { $ne: req.params.id }
      });
      if (existingGrade) {
        throw new Error(`Grade with level ${level} already exists`);
      }
      return true;
    }),

  check('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),

  validatorMiddleware,
];

/**
 * التحقق من حذف صف
 */
exports.deleteGradeValidator = [
  check('id').isMongoId().withMessage('Invalid Grade ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تبديل حالة الصف
 */
exports.toggleGradeValidator = [
  check('id').isMongoId().withMessage('Invalid Grade ID format'),
  validatorMiddleware,
];