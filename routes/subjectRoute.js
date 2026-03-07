const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const subjectService = require('../services/subjectService');

// ✅ استيراد Validators
const {
  createSubjectValidator,
  getSubjectValidator,
  updateSubjectValidator,
  deleteSubjectValidator,
  toggleSubjectValidator,
} = require('../utils/validators/subjectValidator');

const router = express.Router();

// ==================== كل اللي تحتاج مصادقة ====================
router.use(protect);

// ==================== للمستخدمين المسجلين (عرض فقط) ====================
router.get('/', subjectService.getSubjects);
router.get('/:id', getSubjectValidator, subjectService.getSubject);
router.get('/:id/structure', getSubjectValidator, subjectService.getSubjectStructure);

// ==================== للأدمن فقط ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

// ✅ استخدام Validators هنا
router.post('/', createSubjectValidator, subjectService.createSubject);
router.put('/:id', updateSubjectValidator, subjectService.updateSubject);
router.delete('/:id', deleteSubjectValidator, subjectService.deleteSubject);
router.patch('/:id/toggle', toggleSubjectValidator, subjectService.toggleSubjectStatus);

module.exports = router;