const { check, param, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Lesson = require('../../models/lessonModel');
const Assignment = require('../../models/assignmentModel');

// ==================== Validators للواجبات ====================

exports.createAssignmentValidator = [
  param('lessonId').isMongoId().withMessage('Invalid Lesson ID format'),
  
  body('title')
    .notEmpty().withMessage('Assignment title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid due date format')
    .custom((dueDate) => {
      if (new Date(dueDate) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('maxPoints')
    .optional()
    .isInt({ min: 1 }).withMessage('Max points must be at least 1'),
  
  body('passingPoints')
    .optional()
    .isInt({ min: 0 }).withMessage('Passing points must be non-negative'),
  
  body('submissionType')
    .optional()
    .isIn(['file', 'text', 'both']).withMessage('Invalid submission type'),
  
  validatorMiddleware,
];

exports.getAssignmentValidator = [
  param('id').isMongoId().withMessage('Invalid Assignment ID format'),
  validatorMiddleware,
];

exports.updateAssignmentValidator = [
  param('id').isMongoId().withMessage('Invalid Assignment ID format'),
  body('title').optional().isLength({ min: 3, max: 200 }),
  body('dueDate').optional().isISO8601(),
  validatorMiddleware,
];

exports.deleteAssignmentValidator = [
  param('id').isMongoId().withMessage('Invalid Assignment ID format'),
  validatorMiddleware,
];

// ==================== Validators للتسليمات ====================

exports.submitAssignmentValidator = [
  param('assignmentId').isMongoId().withMessage('Invalid Assignment ID format'),
  body('content').optional().isString().withMessage('Content must be a string'),
  validatorMiddleware,
];

exports.getMySubmissionValidator = [
  param('assignmentId').isMongoId().withMessage('Invalid Assignment ID format'),
  validatorMiddleware,
];

exports.getSubmissionsByAssignmentValidator = [
  param('assignmentId').isMongoId().withMessage('Invalid Assignment ID format'),
  validatorMiddleware,
];

exports.gradeSubmissionValidator = [
  param('submissionId').isMongoId().withMessage('Invalid Submission ID format'),
  body('grade').isFloat({ min: 0 }).withMessage('Grade must be a positive number'),
  body('feedback').optional().isString(),
  validatorMiddleware,
];

exports.getAssignmentsByLessonValidator = [
  param('lessonId').isMongoId().withMessage('Invalid Lesson ID format'),
  validatorMiddleware,
];

exports.downloadAttachmentValidator = [
  param('assignmentId').isMongoId().withMessage('Invalid Assignment ID format'),
  param('fileIndex').isInt({ min: 0 }).withMessage('Invalid file index'),
  validatorMiddleware,
];