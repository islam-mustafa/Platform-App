const { check, param, header } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Lesson = require('../../models/lessonModel');
const StudentLesson = require('../../models/studentLessonModel');
const Transaction = require('../../models/transactionModel');

/**
 * @desc    Validator بدء عملية الدفع (checkout)
 */
exports.checkoutValidator = [
  header('idempotency-key')
    .notEmpty().withMessage('Idempotency-Key header is required')
    .isString().withMessage('Idempotency-Key must be a string'),
  
  check('lessonId')
    .notEmpty().withMessage('Lesson ID is required')
    .isMongoId().withMessage('Invalid lesson ID format')
    .custom(async (lessonId, { req }) => {
      // التحقق من وجود الدرس
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      
      // التحقق من أن الدرس مدفوع
      if (!lesson.isPremium) {
        throw new Error('This lesson is free');
      }
      
      // حفظ الدرس في req للاستخدام لاحقاً
      req.lesson = lesson;
      return true;
    }),
  
  check('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['card', 'fawry', 'wallet']).withMessage('Invalid payment method'),
  
  check('couponCode')
    .optional()
    .isString().withMessage('Coupon code must be a string')
    .isLength({ min: 3, max: 20 }).withMessage('Coupon code must be between 3 and 20 characters')
    .customSanitizer(value => value?.toUpperCase()),
  
  // التحقق من أن المستخدم لم يشترِ الدرس بالفعل
  check('lessonId').custom(async (lessonId, { req }) => {
    const userId = req.user?._id;
    if (!userId) return true;
    
    const existingAccess = await StudentLesson.findOne({
      userId,
      lessonId,
      hasAccess: true
    });
    
    if (existingAccess) {
      throw new Error('You already have access to this lesson');
    }
    return true;
  }),
  
  // التحقق من عدم وجود معاملة معلقة لنفس الدرس
  check('lessonId').custom(async (lessonId, { req }) => {
    const userId = req.user?._id;
    if (!userId) return true;
    
    const existingPending = await Transaction.findOne({
      userId,
      lessonId,
      status: 'pending'
    });
    
    if (existingPending) {
      // تخزين المعاملة المعلقة في req للاستخدام
      req.existingPendingTransaction = existingPending;
    }
    return true;
  }),
  
  validatorMiddleware,
];

/**
 * @desc    Validator جلب حالة المعاملة
 */
exports.getTransactionStatusValidator = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isString().withMessage('Order ID must be a string'),
  
  validatorMiddleware,
];

/**
 * @desc    Validator جلب معاملات المستخدم
 */
exports.getUserTransactionsValidator = [
  // لا يحتاج validators إضافية، فقط التأكد من أن المستخدم مسجل دخول (protect)
  validatorMiddleware,
];