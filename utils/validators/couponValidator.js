const { check, param } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Coupon = require('../../models/couponModel');

/**
 * @desc    Validator إنشاء كوبون جديد
 */
exports.createCouponValidator = [
  check('code')
    .notEmpty().withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 }).withMessage('Coupon code must be between 3 and 20 characters')
    .custom(async (val) => {
      const coupon = await Coupon.findOne({ code: val.toUpperCase() });
      if (coupon) {
        throw new Error('Coupon code already exists');
      }
      return true;
    }),
  
  check('discountType')
    .notEmpty().withMessage('Discount type is required')
    .isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  
  check('discountValue')
    .notEmpty().withMessage('Discount value is required')
    .isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  
  check('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error('End date must be in the future');
      }
      return true;
    }),
  
  check('minOrderAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum order amount must be a positive number'),
  
  check('usageLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
  
  check('perUserLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('Per user limit must be at least 1'),
  
  check('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  validatorMiddleware,
];

/**
 * @desc    Validator تحديث كوبون
 */
exports.updateCouponValidator = [
  param('id').isMongoId().withMessage('Invalid coupon ID format'),
  
  check('code')
    .optional()
    .isLength({ min: 3, max: 20 }).withMessage('Coupon code must be between 3 and 20 characters')
    .custom(async (val, { req }) => {
      const coupon = await Coupon.findOne({ 
        code: val.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (coupon) {
        throw new Error('Coupon code already exists');
      }
      return true;
    }),
  
  check('discountType')
    .optional()
    .isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  
  check('discountValue')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  
  check('endDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  validatorMiddleware,
];

/**
 * @desc    Validator جلب كوبون بالـ ID
 */
exports.getCouponValidator = [
  param('id').isMongoId().withMessage('Invalid coupon ID format'),
  validatorMiddleware,
];

/**
 * @desc    Validator حذف كوبون
 */
exports.deleteCouponValidator = [
  param('id').isMongoId().withMessage('Invalid coupon ID format'),
  validatorMiddleware,
];

/**
 * @desc    Validator جلب كوبون بالكود
 */
exports.getCouponByCodeValidator = [
  param('code').notEmpty().withMessage('Coupon code is required'),
  validatorMiddleware,
];