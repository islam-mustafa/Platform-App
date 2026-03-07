const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const sectionService = require('../services/sectionService');
const {
  createSectionValidator,
  getSectionValidator,
  updateSectionValidator,
  deleteSectionValidator,
  toggleSectionValidator,
} = require('../utils/validators/sectionValidator');

const router = express.Router();

// ==================== جميع المسارات تحتاج مصادقة ====================
router.use(protect);

// ==================== مسارات عامة (للمستخدمين) ====================
router.get('/', sectionService.getSections);
router.get('/:id', getSectionValidator, sectionService.getSection);

// ==================== مسارات الأدمن والسوبر أدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

// إنشاء قسم جديد
router.post('/', createSectionValidator, sectionService.createSection);

// تحديث قسم
router.put('/:id', updateSectionValidator, sectionService.updateSection);

// حذف قسم
router.delete('/:id', deleteSectionValidator, sectionService.deleteSection);

// تبديل حالة القسم (تفعيل/تعطيل)
router.patch('/:id/toggle', toggleSectionValidator, sectionService.toggleSectionStatus);

// إعادة ترتيب الأقسام
router.post('/reorder', sectionService.reorderSections);

module.exports = router;