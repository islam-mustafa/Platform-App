const express = require('express');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const quizService = require('../services/quizService');
const {
  createQuizValidator,
  getQuizValidator,
  getQuizByLessonValidator,
  updateQuizValidator,
  deleteQuizValidator,
  startQuizAttemptValidator,
  submitAnswerValidator,
  submitAllAnswersValidator,
  completeQuizAttemptValidator,
  getUserAttemptsValidator,
  getQuizAttemptsByAdminValidator,
  getAttemptDetailsValidator,
  extendAttemptValidator,
  resetStudentAttemptsValidator,
  reactivateAttemptValidator,
  extendAllAttemptsValidator, // ✅ جديد
} = require('../utils/validators/quizValidator');

const router = express.Router();

router.use(protect);

// ==================== مسارات الطالب ====================

router.get('/quiz/lesson/:lessonId', getQuizByLessonValidator, quizService.getQuizByLesson);
router.post('/quizzes/:quizId/attempt', startQuizAttemptValidator, quizService.startQuizAttempt);
router.post('/attempts/:attemptId/submit-all', submitAllAnswersValidator, quizService.submitAllAnswers);
router.get('/quizzes/:quizId/attempts', getUserAttemptsValidator, quizService.getUserAttempts);

// ==================== مسارات الأدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.post('/quiz/lesson/:lessonId', createQuizValidator, quizService.createQuiz);
router.get('/quizzes', quizService.getAllQuizzes);
router.get('/quizzes/:id', getQuizValidator, quizService.getQuiz);
router.put('/quizzes/:id', updateQuizValidator, quizService.updateQuiz);
router.delete('/quizzes/:id', deleteQuizValidator, quizService.deleteQuiz);

// لوحة تحكم الأدمن
router.get('/quizzes/:quizId/attempts/admin', getQuizAttemptsByAdminValidator, quizService.getQuizAttemptsByAdmin);
router.get('/attempts/:attemptId/details', getAttemptDetailsValidator, quizService.getAttemptDetails);
router.patch('/attempts/:attemptId/extend', extendAttemptValidator, quizService.extendAttemptTime);
router.delete('/quizzes/:quizId/users/:userId/attempts', resetStudentAttemptsValidator, quizService.resetStudentAttempts);
// ✅ تمديد الوقت لكل المحاولات الشغالة في كويز (للأدمن فقط)
router.patch('/quizzes/:quizId/attempts/extend-all', extendAllAttemptsValidator, quizService.extendAllActiveAttempts);
// ✅ إعادة تنشيط محاولة منتهية (للأدمن فقط)
router.patch('/attempts/:attemptId/reactivate', reactivateAttemptValidator, quizService.reactivateExpiredAttempt);

module.exports = router;