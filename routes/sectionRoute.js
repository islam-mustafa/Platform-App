const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const sectionService = require('../services/sectionService');
const {
  createSectionValidator,
  getSectionValidator,
  updateSectionValidator,
  deleteSectionValidator,
} = require('../utils/validators/sectionValidator');

const router = express.Router();

// ==================== كل اللي تحتاج مصادقة ====================
router.use(protect);

// ==================== للمستخدمين المسجلين (عرض فقط) ====================
router.get('/', sectionService.getSections);
router.get('/:id', getSectionValidator, sectionService.getSection);
router.get('/:id/lessons', getSectionValidator, sectionService.getSectionLessons);

// ==================== للأدمن فقط ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.post('/', createSectionValidator, sectionService.createSection);
router.put('/:id', updateSectionValidator, sectionService.updateSection);
router.delete('/:id', deleteSectionValidator, sectionService.deleteSection);
router.patch('/:id/toggle', getSectionValidator, sectionService.toggleSectionStatus);

module.exports = router;