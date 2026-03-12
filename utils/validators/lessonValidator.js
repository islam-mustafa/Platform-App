const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Section = require('../../models/sectionModel');
const Lesson = require('../../models/lessonModel');

/**
 * التحقق من إنشاء درس جديد
 */
exports.createLessonValidator = [
  check('title')
    .notEmpty()
    .withMessage('Lesson title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    // ✅ منع تكرار اسم الدرس داخل نفس القسم
    .custom(async (title, { req }) => {
      const existingLesson = await Lesson.findOne({
        title: title,
        sectionId: req.body.sectionId
      });
      
      if (existingLesson) {
        throw new Error(`Lesson with title "${title}" already exists in this section`);
      }
      
      return true;
    }),

  check('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  check('sectionId')
    .notEmpty()
    .withMessage('Section ID is required')
    .isMongoId()
    .withMessage('Invalid Section ID format')
    .custom(async (sectionId) => {
      const section = await Section.findById(sectionId);
      if (!section) {
        throw new Error('Section not found');
      }
      return true;
    }),

  check('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),

  check('isPremium')
    .optional()
    .isBoolean()
    .withMessage('isPremium must be a boolean value'),

  check('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .custom((price, { req }) => {
      if (req.body.isPremium && (!price || price <= 0)) {
        throw new Error('Price is required for premium lessons');
      }
      return true;
    }),

  check('content.videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),

  check('content.duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),

  validatorMiddleware,
];

/**
 * التحقق من جلب درس واحد
 */
exports.getLessonValidator = [
  check('id').isMongoId().withMessage('Invalid Lesson ID format'),
  validatorMiddleware,
];

/**
 * التحقق من جلب محتوى درس (للمستخدم)
 */
exports.getLessonContentValidator = [
  check('id').isMongoId().withMessage('Invalid Lesson ID format'),
  validatorMiddleware,
];

/**
 * التحقق من شراء درس
 */
exports.purchaseLessonValidator = [
  check('id').isMongoId().withMessage('Invalid Lesson ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تحديث درس
 */
exports.updateLessonValidator = [
  check('id').isMongoId().withMessage('Invalid Lesson ID format'),

  check('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    // ✅ منع تكرار اسم الدرس عند التعديل (مع استثناء نفس الدرس)
    .custom(async (title, { req }) => {
      const existingLesson = await Lesson.findOne({
        title: title,
        sectionId: req.body.sectionId,
        _id: { $ne: req.params.id }
      });
      
      if (existingLesson) {
        throw new Error(`Lesson with title "${title}" already exists in this section`);
      }
      
      return true;
    }),

  check('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

    check('price')
  .optional()
  .isFloat({ min: 0 })
  .withMessage('Price must be a positive number')
  .custom((price, { req }) => {
    // لو isPremium موجود و true، لازم price > 0
    if (req.body.isPremium === true && (!price || price <= 0)) {
      throw new Error('Price is required for premium lessons');
    }
    // لو isPremium موجود و false، لازم price = 0
    if (req.body.isPremium === false && price && price > 0) {
      throw new Error('Free lessons cannot have a price');
    }
    return true;
  }),

  check('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),

  check('isPremium')
    .optional()
    .isBoolean()
    .withMessage('isPremium must be a boolean value'),

  check('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .custom((price, { req }) => {
      if (req.body.isPremium && (!price || price <= 0)) {
        throw new Error('Price is required for premium lessons');
      }
      return true;
    }),

  check('content.videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),

  check('content.duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),

  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  validatorMiddleware,
];

/**
 * التحقق من حذف درس
 */
exports.deleteLessonValidator = [
  check('id').isMongoId().withMessage('Invalid Lesson ID format'),
  validatorMiddleware,
];

/**
 * التحقق من جلب دروس قسم معين
 */
exports.getLessonsBySectionValidator = [
  check('sectionId').isMongoId().withMessage('Invalid Section ID format'),
  validatorMiddleware,
];

/**
 * التحقق من تبديل حالة الدرس
 */
exports.toggleLessonValidator = [
  check('id').isMongoId().withMessage('Invalid Lesson ID format'),
  validatorMiddleware,
];

/**
 * التحقق من إعادة ترتيب الدروس
 */
exports.reorderLessonsValidator = [
  check('lessons')
    .isArray({ min: 1 })
    .withMessage('Lessons must be a non-empty array'),
  check('lessons.*.id')
    .isMongoId()
    .withMessage('Each lesson must have a valid ID'),
  check('lessons.*.order')
    .isInt({ min: 0 })
    .withMessage('Each lesson must have a valid order number'),
  validatorMiddleware,
];