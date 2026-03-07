const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const lessonService = require('../services/lessonService');
const {
  createLessonValidator,
  getLessonValidator,
  getLessonContentValidator,
  updateLessonValidator,
  deleteLessonValidator,
  getLessonsBySectionValidator,
  toggleLessonValidator,
  reorderLessonsValidator,
} = require('../utils/validators/lessonValidator');

const router = express.Router();

// ==================== جميع المسارات تحتاج مصادقة ====================
router.use(protect);

// ==================== مسارات عامة (للمستخدمين) ====================

// جلب جميع الدروس (مع pagination)
router.get('/', lessonService.getLessons);

// جلب درس واحد
router.get('/:id', getLessonValidator, lessonService.getLesson);

// جلب محتوى درس كامل (للمستخدم)
router.get('/:id/content', getLessonContentValidator, lessonService.getLessonContent);

// جلب دروس قسم معين
router.get('/section/:sectionId', getLessonsBySectionValidator, lessonService.getLessonsBySection);

// ==================== مسارات الأدمن والسوبر أدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

// إنشاء درس جديد
router.post('/', createLessonValidator, lessonService.createLesson);

// تحديث درس
router.put('/:id', updateLessonValidator, lessonService.updateLesson);

// حذف درس
router.delete('/:id', deleteLessonValidator, lessonService.deleteLesson);

// تبديل حالة الدرس (تفعيل/تعطيل)
router.patch('/:id/toggle', toggleLessonValidator, lessonService.toggleLessonStatus);

// إعادة ترتيب الدروس
router.post('/reorder', reorderLessonsValidator, lessonService.reorderLessons);

module.exports = router;