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
  purchaseLessonValidator,
  uploadVideoValidator,
  deleteVideoValidator
} = require('../utils/validators/lessonValidator');

const router = express.Router();

// ==================== جميع المسارات تحتاج مصادقة ====================
router.use(protect);
// ✅ Route اختبارية للتأكد من الفلتر

// ==================== مسارات عامة (للمستخدمين) ====================

// جلب جميع الدروس (بدون محتوى نصي للمستخدم العادي)
router.get('/', lessonService.getLessons);

// جلب درس واحد (بدون محتوى نصي للمستخدم العادي)
router.get('/:id', getLessonValidator, lessonService.getLesson);

// جلب محتوى درس كامل (للمستخدم)
router.get('/:id/content', getLessonContentValidator, lessonService.getLessonContent);

// ✅ تجديد رابط الفيديو (يستخدم أثناء المشاهدة)
router.post('/:id/refresh-token', getLessonValidator, lessonService.refreshVideoToken);


// جلب دروس قسم معين
router.get('/section/:sectionId', getLessonsBySectionValidator, lessonService.getLessonsBySection);

// شراء درس
router.post('/:id/purchase', purchaseLessonValidator, lessonService.purchaseLesson);

// ==================== مسارات الأدمن والسوبر أدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

const uploadVideoMiddleware = require('../middlewares/uploadVideoMiddleware');

// ...

router.post('/:id/upload-video', 
  uploadVideoMiddleware.uploadVideo,  // ✅ لازم يكون قبل Validator
  uploadVideoValidator, 
  lessonService.uploadLessonVideo
);

router.delete('/:lessonId/videos/:videoIndex', 
  deleteVideoValidator, 
  lessonService.deleteLessonVideo
);

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