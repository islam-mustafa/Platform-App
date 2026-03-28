const { check, param, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Lesson = require('../../models/lessonModel');
const Quiz = require('../../models/quizModel');
const QuizAttempt = require('../../models/quizAttemptModel');

// ==================== Validators للكويزات ====================

exports.createQuizValidator = [
  param('lessonId')
    .isMongoId()
    .withMessage('Invalid Lesson ID format')
    .custom(async (lessonId) => {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) throw new Error('Lesson not found');
      const existingQuiz = await Quiz.findOne({ lessonId });
      if (existingQuiz) throw new Error('Quiz already exists for this lesson');
      return true;
    }),
  check('title')
    .notEmpty().withMessage('Quiz title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  check('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  check('timeLimit')
    .optional()
    .isInt({ min: 0 }).withMessage('Time limit must be a positive integer'),
  check('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
  check('attemptsAllowed')
    .optional()
    .isInt({ min: 1 }).withMessage('Attempts allowed must be at least 1'),
  check('questions')
    .isArray({ min: 1 }).withMessage('Quiz must have at least one question'),
  check('questions.*.questionText')
    .notEmpty().withMessage('Question text is required'),
  check('questions.*.type')
    .isIn(['multiple_choice', 'true_false', 'essay']).withMessage('Invalid question type'),
  check('questions.*.points')
    .optional()
    .isInt({ min: 1 }).withMessage('Points must be at least 1'),
  check('questions.*.options')
    .custom((options, { req }) => {
      const questionIndex = options?.__index;
      const question = req.body.questions[questionIndex];
      if (question?.type === 'multiple_choice') {
        if (!options || options.length < 2) throw new Error('Multiple choice questions must have at least 2 options');
        const hasCorrect = options.some(opt => opt.isCorrect === true);
        if (!hasCorrect) throw new Error('Multiple choice question must have at least one correct answer');
      }
      return true;
    }),
  validatorMiddleware,
];

exports.getQuizValidator = [
  check('id').isMongoId().withMessage('Invalid Quiz ID format'),
  validatorMiddleware,
];

exports.getQuizByLessonValidator = [
  param('lessonId').isMongoId().withMessage('Invalid Lesson ID format'),
  validatorMiddleware,
];

exports.updateQuizValidator = [
  check('id').isMongoId().withMessage('Invalid Quiz ID format'),
  check('title').optional().isLength({ min: 3, max: 200 }),
  check('description').optional().isLength({ max: 1000 }),
  check('timeLimit').optional().isInt({ min: 0 }),
  check('passingScore').optional().isInt({ min: 0, max: 100 }),
  check('attemptsAllowed').optional().isInt({ min: 1 }),
  validatorMiddleware,
];

exports.deleteQuizValidator = [
  check('id').isMongoId().withMessage('Invalid Quiz ID format'),
  validatorMiddleware,
];

// ==================== Validators لمحاولات الطالب ====================

exports.startQuizAttemptValidator = [
  param('quizId').isMongoId().withMessage('Invalid Quiz ID format'),
  validatorMiddleware,
];

exports.submitAnswerValidator = [
  param('attemptId').isMongoId().withMessage('Invalid Attempt ID format'),
  param('questionId').isMongoId().withMessage('Invalid Question ID format'),
  body('answer').notEmpty().withMessage('Answer is required'),
  validatorMiddleware,
];

exports.submitAllAnswersValidator = [
  param('attemptId').isMongoId().withMessage('Invalid Attempt ID format'),
  body('answers').isArray({ min: 1 }).withMessage('Answers must be a non-empty array'),
  body('answers.*.questionId').isMongoId().withMessage('Each answer must have a valid questionId'),
  body('answers.*.answer').notEmpty().withMessage('Each answer is required'),
  validatorMiddleware,
];

exports.completeQuizAttemptValidator = [
  param('attemptId').isMongoId().withMessage('Invalid Attempt ID format'),
  validatorMiddleware,
];

exports.getUserAttemptsValidator = [
  param('quizId').isMongoId().withMessage('Invalid Quiz ID format'),
  validatorMiddleware,
];

// ==================== Validators للأدمن ====================

exports.getQuizAttemptsByAdminValidator = [
  param('quizId').isMongoId().withMessage('Invalid Quiz ID format'),
  validatorMiddleware,
];

exports.getAttemptDetailsValidator = [
  param('attemptId').isMongoId().withMessage('Invalid Attempt ID format'),
  validatorMiddleware,
];

// ✅ التحقق من تمديد المدة
exports.extendAttemptValidator = [
  param('attemptId').isMongoId().withMessage('Invalid Attempt ID format'),
  body('extraMinutes').isInt({ min: 1, max: 60 }).withMessage('Extra minutes must be between 1 and 60'),
  validatorMiddleware,
];

// ✅ التحقق من إعادة تعيين محاولات الطالب
exports.resetStudentAttemptsValidator = [
  param('quizId').isMongoId().withMessage('Invalid Quiz ID format'),
  param('userId').isMongoId().withMessage('Invalid User ID format'),
  body('newAttemptsAllowed').optional().isInt({ min: 1, max: 10 }).withMessage('New attempts allowed must be between 1 and 10'),
  validatorMiddleware,
];

// ✅ التحقق من إعادة تنشيط محاولة منتهية
exports.reactivateAttemptValidator = [
  param('attemptId').isMongoId().withMessage('Invalid Attempt ID format'),
  body('extraMinutes').optional().isInt({ min: 1, max: 60 }).withMessage('Extra minutes must be between 1 and 60'),
  validatorMiddleware,
];

// ✅ التحقق من تمديد الوقت لكل المحاولات
exports.extendAllAttemptsValidator = [
  param('quizId').isMongoId().withMessage('Invalid Quiz ID format'),
  body('extraMinutes').isInt({ min: 1, max: 60 }).withMessage('Extra minutes must be between 1 and 60'),
  validatorMiddleware,
];