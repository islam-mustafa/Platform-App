const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const subjectService = require('../services/subjectService');
const {
  createSubjectValidator,
  getSubjectValidator,
  updateSubjectValidator,
  deleteSubjectValidator,
  toggleSubjectValidator,
  getSubjectStructureValidator,
} = require('../utils/validators/subjectValidator');

const router = express.Router();

// ==================== جميع المسارات تحتاج مصادقة ====================
router.use(protect);

// ==================== مسارات عامة (للمستخدمين) ====================
router.get('/', subjectService.getSubjects);
router.get('/:id', getSubjectValidator, subjectService.getSubject);
router.get('/:id/structure', getSubjectStructureValidator, subjectService.getSubjectStructure);

// ==================== مسارات الأدمن والسوبر أدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

// إنشاء مادة (السوبر أدمن فقط)
router.post('/', createSubjectValidator, subjectService.createSubject);

// تحديث مادة
router.put('/:id', updateSubjectValidator, subjectService.updateSubject);

// حذف مادة
router.delete('/:id', deleteSubjectValidator, subjectService.deleteSubject);

// تبديل حالة المادة (تفعيل/تعطيل)
router.patch('/:id/toggle', toggleSubjectValidator, subjectService.toggleSubjectStatus);

module.exports = router;