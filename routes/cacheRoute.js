const express = require('express');
const cacheService = require('../services/cacheService');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');

const router = express.Router();

// ✅ كل مسارات الكاش محتاجة super_admin بس
router.use(protect);
router.use(allowedTo(ROLES.SUPER_ADMIN));

/**
 * @desc    جلب إحصائيات الكاش
 * @route   GET /api/v1/cache/stats
 * @access  Super Admin
 */
router.get('/stats', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: cacheService.getStats()
  });
});

/**
 * @desc    مسح كل الكاش
 * @route   DELETE /api/v1/cache/flush
 * @access  Super Admin
 */
router.delete('/flush', (req, res) => {
  cacheService.flush();
  res.status(200).json({
    status: 'success',
    message: 'Cache flushed successfully'
  });
});

module.exports = router;