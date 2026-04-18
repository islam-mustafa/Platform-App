const Transaction = require('../models/transactionModel');
const ApiError = require('../utils/apiError');
const { PAYMENT_STATUS, CURRENCY } = require('../utils/constants');
const couponService = require('./couponService');

const generateMockId = () => {
  return Math.floor(Math.random() * 1000000).toString();
};

const generateMockIframeUrl = (paymentKey) => {
  return `https://mock-paymob.example.com/iframe/${paymentKey}`;
};

exports.createPaymentRequest = async (lesson, user, paymentMethod, idempotencyKey, couponCode = null) => {
  try {
    const existingTransaction = await Transaction.findOne({ idempotencyKey });
    
    if (existingTransaction && existingTransaction.status === PAYMENT_STATUS.PENDING) {
      return {
        iframeUrl: existingTransaction.metadata.iframeUrl,
        orderId: existingTransaction.paymobOrderId,
        paymentKey: existingTransaction.metadata.paymentKey,
        isRetry: true
      };
    }
    
    const orderId = generateMockId();
    const paymentKey = generateMockId();
    const iframeUrl = generateMockIframeUrl(paymentKey);
    
    // ✅ معالجة الكوبون (لو موجود)
    let finalAmount = lesson.price;
    let couponData = null;
    
    if (couponCode) {
      try {
        const couponResult = await couponService.validateAndApplyCoupon(
          couponCode,
          lesson._id.toString(),
          user._id.toString(),
          lesson.price
        );
        
        if (couponResult.valid) {
          finalAmount = couponResult.finalPrice;
          couponData = {
            couponId: couponResult.couponId,
            code: couponResult.code,
            discountType: couponResult.discountType,
            discountValue: couponResult.discountValue,
            discountAmount: couponResult.discountAmount,
            originalAmount: couponResult.originalPrice,
            finalAmount: couponResult.finalPrice
          };
          console.log(`✅ Coupon ${couponCode} applied: ${lesson.price} → ${finalAmount} EGP`);
        }
      } catch (error) {
        console.error('Coupon validation error:', error.message);
        throw error;
      }
    }
    
    const transaction = await Transaction.create({
      userId: user._id,
      lessonId: lesson._id,
      amount: finalAmount,
      currency: lesson.currency || CURRENCY.EGP,
      paymentMethod,
      status: PAYMENT_STATUS.PENDING,
      paymobOrderId: orderId,
      idempotencyKey,
      metadata: {
        iframeUrl,
        paymentKey,
        lessonTitle: lesson.title,
        userEmail: user.email,
        ...(couponData && { coupon: couponData })
      }
    });
    
    return {
      iframeUrl,
      orderId,
      paymentKey,
      transactionId: transaction._id,
      isRetry: false,
      appliedCoupon: couponData,
      originalPrice: lesson.price,
      finalPrice: finalAmount
    };
    
  } catch (error) {
    console.error('Error creating payment request:', error);
    if (error.code === 11000) {
      throw new ApiError('Duplicate request. Please use a new idempotency key.', 409);
    }
    throw new ApiError('Failed to create payment request', 500);
  }
};

exports.handlePaymentWebhook = async (webhookData) => {
  try {
    const { paymobTransactionId, orderId, success, amount } = webhookData;
    
    if (!orderId) {
      throw new Error('Missing orderId in webhook data');
    }
    
    const transaction = await Transaction.findOne({ paymobOrderId: orderId });
    
    if (!transaction) {
      console.warn(`Transaction not found for orderId: ${orderId}`);
      return { received: true, processed: false, success: false, message: 'Transaction not found' };
    }
    
    if (transaction.status === PAYMENT_STATUS.COMPLETED) {
      return { 
        received: true, 
        processed: false, 
        success: true, 
        message: 'Already completed',
        transaction: {
          userId: transaction.userId,
          lessonId: transaction.lessonId,
          amount: transaction.amount
        }
      };
    }
    
    if (success) {
      transaction.status = PAYMENT_STATUS.COMPLETED;
      if (paymobTransactionId) {
        transaction.paymobTransactionId = paymobTransactionId;
      }
      transaction.completedAt = new Date();
      await transaction.save();
      
      console.log(`✅ Payment completed for order ${orderId}, user ${transaction.userId}, lesson ${transaction.lessonId}`);
      
      return {
        received: true,
        processed: true,
        success: true,
        transaction: {
          userId: transaction.userId,
          lessonId: transaction.lessonId,
          amount: transaction.amount
        }
      };
    } else {
      transaction.status = PAYMENT_STATUS.FAILED;
      await transaction.save();
      
      console.log(`❌ Payment failed for order ${orderId}`);
      
      return {
        received: true,
        processed: true,
        success: false,
        message: 'Payment failed'
      };
    }
    
  } catch (error) {
    console.error('Error handling payment webhook:', error);
    throw error;
  }
};

exports.getTransactionStatus = async (orderId) => {
  const transaction = await Transaction.findOne({ paymobOrderId: orderId });
  if (!transaction) {
    throw new ApiError('Transaction not found', 404);
  }
  return {
    status: transaction.status,
    amount: transaction.amount,
    createdAt: transaction.createdAt,
    completedAt: transaction.completedAt
  };
};

// ✅ تسجيل استخدام الكوبون بعد الدفع الناجح
exports.markCouponAsUsed = async (transaction) => {
  if (transaction.metadata?.coupon?.couponId) {
    await couponService.markCouponAsUsed(
      transaction.metadata.coupon.couponId,
      transaction.userId,
      transaction.paymobOrderId
    );
    console.log(`✅ Coupon ${transaction.metadata.coupon.code} marked as used`);
  }
};

exports.mockSuccessfulPayment = async (orderId) => {
  const transaction = await Transaction.findOne({ paymobOrderId: orderId });
  if (!transaction) throw new ApiError('Transaction not found', 404);
  if (transaction.status !== PAYMENT_STATUS.PENDING) throw new ApiError('Transaction already processed', 400);
  
  transaction.status = PAYMENT_STATUS.COMPLETED;
  transaction.paymobTransactionId = `mock_${Date.now()}`;
  transaction.completedAt = new Date();
  await transaction.save();
  
  // ✅ تسجيل استخدام الكوبون لو موجود
  await exports.markCouponAsUsed(transaction);
  
  return {
    userId: transaction.userId,
    lessonId: transaction.lessonId,
    amount: transaction.amount
  };
};

exports.mockFailedPayment = async (orderId) => {
  const transaction = await Transaction.findOne({ paymobOrderId: orderId });
  if (!transaction) throw new ApiError('Transaction not found', 404);
  if (transaction.status !== PAYMENT_STATUS.PENDING) throw new ApiError('Transaction already processed', 400);
  
  transaction.status = PAYMENT_STATUS.FAILED;
  await transaction.save();
  
  return {
    userId: transaction.userId,
    lessonId: transaction.lessonId,
    amount: transaction.amount
  };
};