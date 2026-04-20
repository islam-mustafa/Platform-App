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
  const { lessonId, paymentMethod, couponCode, walletNumber } = req.body; // ✅ أضفنا walletNumber
  const userId = req.user._id;
  const idempotencyKey = req.headers['idempotency-key'];
  const lesson = req.lesson;
  const existingPendingTransaction = req.existingPendingTransaction;
  
  // ✅ لو في معاملة معلقة، نرجعها
  if (existingPendingTransaction) {
    return res.status(200).json({
      status: 'success',
      message: 'Payment already in progress',
      data: {
        iframeUrl: existingPendingTransaction.metadata?.iframeUrl,
        redirectUrl: existingPendingTransaction.metadata?.redirectUrl,
        referenceNumber: existingPendingTransaction.metadata?.referenceNumber,
        orderId: existingPendingTransaction.paymobOrderId,
        transactionId: existingPendingTransaction._id,
        paymentMethod: existingPendingTransaction.paymentMethod
      }
    });
  }
  
  // ✅ إنشاء طلب دفع جديد
  const paymentRequest = await paymentService.createPaymentRequest(
    lesson,
    req.user,
    paymentMethod,
    idempotencyKey,
    couponCode,
    walletNumber // ✅ تمرير رقم المحفظة
  );
  
  // ✅ إرجاع البيانات المناسبة لكل طريقة دفع
  res.status(200).json({
    status: 'success',
    message: paymentRequest.isRetry ? 'Request already processed' : 'Payment initiated',
    data: {
      paymentMethod,
      orderId: paymentRequest.orderId,
      transactionId: paymentRequest.transactionId,

      // بطاقة ائتمان
      ...(paymentRequest.iframeUrl && { iframeUrl: paymentRequest.iframeUrl }),

      // محفظة موبايل
      ...(paymentRequest.redirectUrl && { redirectUrl: paymentRequest.redirectUrl }),

      // كاش (فوري/أمان)
      ...(paymentRequest.referenceNumber && { referenceNumber: paymentRequest.referenceNumber }),
      ...(paymentRequest.cashData && { cashData: paymentRequest.cashData }),

      // كوبون
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