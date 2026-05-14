const rateLimit = require('express-rate-limit');

// ✅ معدل عام لكل الـ API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // أقصى 100 طلب لكل IP
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // إرجاع `RateLimit-*` headers
  legacyHeaders: false, // إلغاء `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // يحسب حتى الطلبات الناجحة
});

// ✅ معدل أشد لـ endpoints الحساسة (تسجيل دخول، دفع)
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  max: 10, // أقصى 10 طلبات
  message: {
    status: 'fail',
    message: 'Too many attempts, please try again after 5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ معدل خفيف لـ endpoints عامة (زي جلب الدروس)
const lightLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 دقيقة
  max: 30, // 30 طلب
  message: {
    status: 'fail',
    message: 'Too many requests, please slow down'
  },
});

// ✅ Webhooks من غير حد (عشان Paymob و Cloudinary)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  skip: (req) => req.path.includes('/webhooks/'), // يتخطى الـ webhooks
});

module.exports = {
  generalLimiter,
  strictLimiter,
  lightLimiter,
  webhookLimiter,
};