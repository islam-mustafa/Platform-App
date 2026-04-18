const Coupon = require('../models/couponModel');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

// ✅ استخدام baseService في دوال CRUD
const couponFactory = factory(Coupon, 'Coupon');

// ============================================================
// ✅ دوال CRUD باستخدام baseService
// ============================================================
exports.getAllCoupons = couponFactory.getAll;
exports.getCoupon = couponFactory.getOne;
exports.createCoupon = couponFactory.createOne;
exports.updateCoupon = couponFactory.updateOne;
exports.deleteCoupon = couponFactory.deleteOne;

// ============================================================
// ✅ دوال مخصصة (غير موجودة في baseService)
// ============================================================

/**
 * @desc    جلب كوبون بالكود
 */
exports.getCouponByCode = async (code) => {
  return await Coupon.findOne({ code: code.toUpperCase() });
};

/**
 * @desc    التحقق من صحة الكوبون وتطبيقه على درس
 */
exports.validateAndApplyCoupon = async (code, lessonId, userId, originalPrice) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  
  if (!coupon) {
    throw new ApiError('Invalid coupon code', 400);
  }
  
  if (!coupon.isActive) {
    throw new ApiError('This coupon is not active', 400);
  }
  
  if (coupon.isExpired()) {
    throw new ApiError('This coupon has expired', 400);
  }
  
  if (!coupon.hasUsageLeft()) {
    throw new ApiError('This coupon has reached its usage limit', 400);
  }
  
  if (!coupon.canUserUse(userId)) {
    throw new ApiError('You have already used this coupon the maximum number of times', 400);
  }
  
  if (!coupon.appliesToLesson(lessonId)) {
    throw new ApiError('This coupon does not apply to this lesson', 400);
  }
  
  if (originalPrice < coupon.minOrderAmount) {
    throw new ApiError(`Minimum order amount for this coupon is ${coupon.minOrderAmount} EGP`, 400);
  }
  
  const { discountAmount, finalAmount } = coupon.calculateDiscount(originalPrice);
  
  return {
    valid: true,
    couponId: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    originalPrice,
    finalPrice: finalAmount,
    coupon
  };
};

/**
 * @desc    تسجيل استخدام الكوبون بعد الدفع الناجح
 */
exports.markCouponAsUsed = async (couponId, userId, orderId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new ApiError('Coupon not found', 404);
  }
  
  await coupon.markAsUsed(userId, orderId);
  return coupon;
};