const couponService = require('../../services/couponService');
const Coupon = require('../../models/couponModel');
const ApiError = require('../../utils/apiError');

describe('CouponService - Unit Tests', () => {

  beforeEach(async () => {
    // بنعمل كوبون صالح قبل كل اختبار
    await Coupon.create({
      code: 'TEST20',
      discountType: 'percentage',
      discountValue: 20,
      endDate: new Date('2026-12-31'), // تاريخ بعيد في المستقبل
    });
  });

  // Test 1: كوبون صالح
  test('should apply valid coupon correctly', async () => {
    const result = await couponService.validateAndApplyCoupon(
      'TEST20',
      'lesson123',
      'user123',
      100 // السعر الأصلي
    );

    expect(result.valid).toBe(true);
    expect(result.finalPrice).toBe(80); // 100 - 20%
    expect(result.discountAmount).toBe(20);
  });

  // Test 2: كوبون مش موجود
  test('should throw error for invalid coupon code', async () => {
    await expect(
      couponService.validateAndApplyCoupon('INVALID', 'lesson123', 'user123', 100)
    ).rejects.toThrow('Invalid coupon code'); // الرسالة اللي احنا مكتوبينها جوة الخدمة
  });

 // Test 3: كوبون منتهي
test('should throw error for expired coupon', async () => {
  // بنعمل كوبون منتهي مخصوص للاختبار (نتجاوز التحقق)
  const expiredCouponData = {
    code: 'EXPIRED',
    discountType: 'percentage',
    discountValue: 10,
    startDate: new Date('2019-01-01'),
    endDate: new Date('2020-01-01'),
    isActive: true,
  };
  
  // نستخدم save مباشرة عشان نتجاوز validator
  const expiredCoupon = new Coupon(expiredCouponData);
  await expiredCoupon.save();

  await expect(
    couponService.validateAndApplyCoupon('EXPIRED', 'lesson123', 'user123', 100)
  ).rejects.toThrow('This coupon has expired');
}); 
})