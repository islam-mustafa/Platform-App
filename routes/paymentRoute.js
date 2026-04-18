const express = require('express');
const { protect } = require('../services/authService');
const paymentService = require('../services/paymentService');
const Transaction = require('../models/transactionModel');
const { 
  checkoutValidator, 
  getTransactionStatusValidator,
  getUserTransactionsValidator 
} = require('../utils/validators/paymentValidator');
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
router.post('/checkout', checkoutValidator, asyncHandler(async (req, res, next) => {
  // 1) استقبال البيانات (lesson تم جلبه من الـ validator)
  const { lessonId, paymentMethod, couponCode } = req.body;
  const userId = req.user._id;
  const idempotencyKey = req.headers['idempotency-key'];
  const lesson = req.lesson; // ✅ من الـ validator
  const existingPendingTransaction = req.existingPendingTransaction; // ✅ من الـ validator
  
  // ✅ لو في معاملة معلقة، نرجعها (تم التحقق منها في الـ validator)
  if (existingPendingTransaction) {
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
  
  // ✅ إنشاء طلب دفع جديد
  const paymentRequest = await paymentService.createPaymentRequest(
    lesson,
    req.user,
    paymentMethod,
    idempotencyKey,
    couponCode
  );
  
  // ✅ إرجاع رابط الدفع
  res.status(200).json({
    status: 'success',
    message: paymentRequest.isRetry ? 'Request already processed' : 'Payment initiated',
    data: {
      iframeUrl: paymentRequest.iframeUrl,
      orderId: paymentRequest.orderId,
      transactionId: paymentRequest.transactionId,
      ...(paymentRequest.appliedCoupon && {
        appliedCoupon: paymentRequest.appliedCoupon,
        originalPrice: paymentRequest.originalPrice,
        finalPrice: paymentRequest.finalPrice
      })
    }
  });
}));

/**
 * @desc    جلب حالة معاملة
 * @route   GET /api/v1/payment/status/:orderId
 * @access  Private
 */
router.get('/status/:orderId', getTransactionStatusValidator, asyncHandler(async (req, res, next) => {
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
      paymentMethod: transaction.paymentMethod,
      ...(transaction.metadata?.coupon && { appliedCoupon: transaction.metadata.coupon })
    }
  });
}));

/**
 * @desc    جلب جميع معاملات المستخدم
 * @route   GET /api/v1/payment/transactions
 * @access  Private
 */
router.get('/transactions', getUserTransactionsValidator, asyncHandler(async (req, res, next) => {
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