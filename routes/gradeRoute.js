const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const gradeService = require('../services/gradeService');
const {
  createGradeValidator,
  getGradeValidator,
  updateGradeValidator,
  deleteGradeValidator,
  toggleGradeValidator,
} = require('../utils/validators/gradeValidator');

const router = express.Router();

// ==================== جميع المسارات تحتاج مصادقة ====================
router.use(protect);

// ==================== مسارات عامة (للمستخدمين) ====================
router.get('/', gradeService.getGrades);
router.get('/:id', getGradeValidator, gradeService.getGrade);

// ==================== مسارات السوبر أدمن فقط ====================
router.use(allowedTo(ROLES.SUPER_ADMIN));

// إنشاء صف جديد
router.post('/', createGradeValidator, gradeService.createGrade);

// تحديث صف
router.put('/:id', updateGradeValidator, gradeService.updateGrade);

// حذف صف
router.delete('/:id', deleteGradeValidator, gradeService.deleteGrade);

// تبديل حالة الصف
router.patch('/:id/toggle', toggleGradeValidator, gradeService.toggleGradeStatus);

module.exports = router;