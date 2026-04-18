const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const couponService = require('../services/couponService');
const { ROLES } = require('../utils/constants');
const asyncHandler = require('express-async-handler');  // ✅ أضف هذا السطر
const {
  createCouponValidator,
  updateCouponValidator,
  getCouponValidator,
  deleteCouponValidator,
  getCouponByCodeValidator
} = require('../utils/validators/couponValidator');

const router = express.Router();

router.use(protect);
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.post('/', createCouponValidator, couponService.createCoupon);
router.get('/', couponService.getAllCoupons);

router.get('/code/:code', getCouponByCodeValidator, asyncHandler(async (req, res, next) => {
  const coupon = await couponService.getCouponByCode(req.params.code);
  if (!coupon) {
    return res.status(404).json({ status: 'fail', message: 'Coupon not found' });
  }
  res.status(200).json({ status: 'success', data: coupon });
}));

router.get('/:id', getCouponValidator, couponService.getCoupon);
router.put('/:id', updateCouponValidator, couponService.updateCoupon);
router.delete('/:id', deleteCouponValidator, couponService.deleteCoupon);

module.exports = router;