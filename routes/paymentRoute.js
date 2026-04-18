const express = require('express');
const { protect } = require('../services/authService');
const paymentService = require('../services/paymentService');
const Lesson = require('../models/lessonModel');
const StudentLesson = require('../models/studentLessonModel');
const Transaction = require('../models/transactionModel');
const ApiError = require('../utils/apiError');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// ✅ جميع مسارات الدفع تحتاج مصادقة
router.use(protect);

/**
 * @desc    بدء عملية شراء درس
 * @route   POST /api/v1/payment/checkout
 * @access  Private
 */
router.post('/checkout', asyncHandler(async (req, res, next) => {
  // 1) استقبال البيانات
  const { lessonId, paymentMethod } = req.body;
  const userId = req.user._id;
  
  // 2) التحقق من وجود Idempotency-Key
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return next(new ApiError('Idempotency-Key header is required', 400));
  }
  
  // 3) التحقق من وجود الدرس
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  // 4) التحقق من أن الدرس مدفوع
  if (!lesson.isPremium) {
    return next(new ApiError('This lesson is free', 400));
  }
  
  // 5) التحقق من أن المستخدم لم يشترِ الدرس بالفعل
  const existingAccess = await StudentLesson.findOne({
    userId,
    lessonId,
    hasAccess: true
  });
  
  if (existingAccess) {
    return next(new ApiError('You already have access to this lesson', 400));
  }
  
  // 6) التحقق من وجود معاملة معلقة لنفس الدرس
  const existingPendingTransaction = await Transaction.findOne({
    userId,
    lessonId,
    status: 'pending'
  });
  
  if (existingPendingTransaction) {
    // لو في معاملة معلقة، نرجع رابطها القديم
    return res.status(200).json({
      status: 'success',
      message: 'Payment already in progress',
      data: {
        iframeUrl: existingPendingTransaction.metadata?.iframeUrl,
        orderId: existingPendingTransaction.paymobOrderId,
        transactionId: existingPendingTransaction._id
      }
    });
  }
  
  // 7) إنشاء طلب دفع جديد
  const paymentRequest = await paymentService.createPaymentRequest(
    lesson,
    req.user,
    paymentMethod,
    idempotencyKey
  );
  
  // 8) إرجاع رابط الدفع
  res.status(200).json({
    status: 'success',
    message: paymentRequest.isRetry ? 'Request already processed' : 'Payment initiated',
    data: {
      iframeUrl: paymentRequest.iframeUrl,
      orderId: paymentRequest.orderId,
      transactionId: paymentRequest.transactionId
    }
  });
}));

/**
 * @desc    جلب حالة معاملة
 * @route   GET /api/v1/payment/status/:orderId
 * @access  Private
 */
router.get('/status/:orderId', asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  
  const transaction = await Transaction.findOne({ 
    paymobOrderId: orderId,
    userId 
  });
  
  if (!transaction) {
    return next(new ApiError('Transaction not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      paymentMethod: transaction.paymentMethod
    }
  });
}));

/**
 * @desc    جلب جميع معاملات المستخدم
 * @route   GET /api/v1/payment/transactions
 * @access  Private
 */
router.get('/transactions', asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  const transactions = await Transaction.find({ userId })
    .populate('lessonId', 'title')
    .sort('-createdAt');
  
  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: transactions
  });
}));

module.exports = router;