const { check, param, header } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Lesson = require('../../models/lessonModel');
const StudentLesson = require('../../models/studentLessonModel');
const Transaction = require('../../models/transactionModel');
const { PAYMENT_METHODS, PAYMENT_STATUS } = require('../../utils/constants');

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
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      
      if (!lesson.isPremium) {
        throw new Error('This lesson is free');
      }
      
      req.lesson = lesson;
      return true;
    }),
  
  check('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(Object.values(PAYMENT_METHODS))  // ✅ استخدام constants
    .withMessage(`Invalid payment method. Allowed: ${Object.values(PAYMENT_METHODS).join(', ')}`),
  
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
      status: PAYMENT_STATUS.PENDING  // ✅ استخدام constants
    });
    
    if (existingPending) {
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
  validatorMiddleware,
];

/**
 * @desc    Validator إعادة محاولة الدفع (للمعاملات الفاشلة)
 */
exports.retryPaymentValidator = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isString().withMessage('Order ID must be a string')
    .custom(async (orderId, { req }) => {
      const userId = req.user?._id;
      if (!userId) return true;
      
      const transaction = await Transaction.findOne({
        paymobOrderId: orderId,
        userId
      });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      if (transaction.status !== PAYMENT_STATUS.FAILED) {  // ✅ استخدام constants
        throw new Error('Only failed transactions can be retried');
      }
      
      req.existingTransaction = transaction;
      return true;
    }),
  
  validatorMiddleware,
];