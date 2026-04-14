const express = require('express');
const multer = require('multer');
const { protect, allowedTo } = require('../services/authService');
const { ROLES } = require('../utils/constants');
const assignmentService = require('../services/assignmentService');
const {
  createAssignmentValidator,
  getAssignmentValidator,
  updateAssignmentValidator,
  deleteAssignmentValidator,
  submitAssignmentValidator,
  gradeSubmissionValidator,
  getMySubmissionValidator,
  getSubmissionsByAssignmentValidator,
  getAssignmentsByLessonValidator,
  downloadAttachmentValidator
} = require('../utils/validators/assignmentValidator');

const router = express.Router();

// ✅ إعداد multer للتخزين المؤقت في الذاكرة
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// ==================== مسارات الطالب (مش محتاجة allowedTo) ====================
router.get('/files/:publicId(*)', assignmentService.viewFile);
router.get('/my-assignments', assignmentService.getMyAssignments);
router.get('/assignments/:assignmentId/my-submission', getMySubmissionValidator, assignmentService.getMySubmission);
router.post('/assignments/:assignmentId/submit', upload.array('attachments'), submitAssignmentValidator, assignmentService.submitAssignment);
router.get('/assignments/:assignmentId/download/:fileIndex', downloadAttachmentValidator, assignmentService.downloadAssignmentAttachment);

// ==================== مسارات الأدمن ====================
router.use(allowedTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.post('/assignment/lesson/:lessonId', upload.array('attachments'), createAssignmentValidator, assignmentService.createAssignment);
router.get('/assignment/lesson/:lessonId', getAssignmentsByLessonValidator, assignmentService.getAssignmentsByLesson);
router.get('/assignments/:id', getAssignmentValidator, assignmentService.getAssignment);
router.put('/assignments/:id', updateAssignmentValidator, assignmentService.updateAssignment);
router.delete('/assignments/:id', deleteAssignmentValidator, assignmentService.deleteAssignment);
router.get('/assignments/:assignmentId/submissions', getSubmissionsByAssignmentValidator, assignmentService.getSubmissionsByAssignment);
router.patch('/submissions/:submissionId/grade', gradeSubmissionValidator, assignmentService.gradeSubmission);

module.exports = router;