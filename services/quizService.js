const Quiz = require('../models/quizModel');
const QuizAttempt = require('../models/quizAttemptModel');
const User = require('../models/userModel');
const Lesson = require('../models/lessonModel');
const StudentLesson = require('../models/studentLessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

// ==================== إدارة الكويزات ====================

exports.createQuiz = asyncHandler(async (req, res, next) => {
  const { lessonId } = req.params;
  
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can create quizzes', 403));
  }
  
  const existingQuiz = await Quiz.findOne({ lessonId });
  if (existingQuiz) {
    return next(new ApiError('Quiz already exists for this lesson', 400));
  }
  
  const quizData = {
    lessonId,
    title: req.body.title,
    description: req.body.description,
    timeLimit: req.body.timeLimit || 0,
    passingScore: req.body.passingScore || 70,
    attemptsAllowed: req.body.attemptsAllowed || 1,
    shuffleQuestions: req.body.shuffleQuestions || false,
    showResults: req.body.showResults !== undefined ? req.body.showResults : true,
    questions: req.body.questions || [],
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };
  
  const quiz = await Quiz.create(quizData);
  lesson.quizId = quiz._id;
  await lesson.save();
  
  res.status(201).json({ status: 'success', data: quiz });
});

exports.getQuizByLesson = asyncHandler(async (req, res, next) => {
  const { lessonId } = req.params;
  
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  if (req.user.role === 'user' && !lesson.isActive) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  if (req.user.role === 'user' && lesson.isPremium) {
    const studentLesson = await StudentLesson.findOne({
      userId: req.user._id,
      lessonId: lesson._id,
      hasAccess: true
    });
    
    if (!studentLesson) {
      return next(new ApiError('You need to purchase this lesson first', 403));
    }
  }
  
  const quiz = await Quiz.findOne({ lessonId });
  if (!quiz) {
    return next(new ApiError('No quiz found for this lesson', 404));
  }
  
  if (req.user.role === 'user') {
    const quizObj = quiz.toObject();
    quizObj.questions = quizObj.questions.map(q => {
      if (q.type === 'multiple_choice') {
        q.options = q.options.map(opt => ({ text: opt.text }));
      }
      delete q.correctAnswer;
      delete q.explanation;
      return q;
    });
    return res.status(200).json({ status: 'success', data: quizObj });
  }
  
  if (!lesson.isActive) {
    return res.status(200).json({ 
      status: 'success',
      warning: 'This lesson is inactive (hidden from regular users)',
      data: quiz
    });
  }
  
  res.status(200).json({ status: 'success', data: quiz });
});

exports.getQuiz = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('You are not allowed to access this route', 403));
  }
  
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return next(new ApiError('Quiz not found', 404));
  }
  
  res.status(200).json({ status: 'success', data: quiz });
});

exports.getAllQuizzes = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can access all quizzes', 403));
  }
  
  const quizzes = await Quiz.find().populate('lessonId', 'title sectionId').sort('-createdAt');
  res.status(200).json({ status: 'success', results: quizzes.length, data: quizzes });
});

exports.updateQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return next(new ApiError('Quiz not found', 404));
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can update quizzes', 403));
  }
  
  const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ status: 'success', data: updatedQuiz });
});

exports.deleteQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return next(new ApiError('Quiz not found', 404));
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can delete quizzes', 403));
  }
  
  await QuizAttempt.deleteMany({ quizId: quiz._id });
  await Lesson.findByIdAndUpdate(quiz.lessonId, { $unset: { quizId: 1 } });
  await Quiz.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// ==================== محاولات الطالب ====================

exports.startQuizAttempt = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ApiError('Quiz not found', 404));
  }
  
  if (!quiz.isActive) {
    return next(new ApiError('Quiz is not available', 403));
  }
  
  const lesson = await Lesson.findById(quiz.lessonId);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  if (req.user.role === 'user') {
    if (!lesson.isActive) return next(new ApiError('Lesson not available', 404));
    if (lesson.isPremium) {
      const studentLesson = await StudentLesson.findOne({
        userId: req.user._id,
        lessonId: lesson._id,
        hasAccess: true
      });
      if (!studentLesson) return next(new ApiError('You need to purchase this lesson first', 403));
    }
  }
  
  // ✅ 1) منع بدء محاولة جديدة لو فيه محاولة شغالة
  const existingInProgress = await QuizAttempt.findOne({
    userId: req.user._id,
    quizId,
    status: 'in_progress'
  });
  
  if (existingInProgress) {
    return res.status(200).json({
      status: 'success',
      message: 'You already have an in-progress attempt. Please complete it first.',
      data: existingInProgress
    });
  }
  
  // ✅ 2) التحقق من عدد المحاولات المكتملة
  const completedAttemptsCount = await QuizAttempt.countDocuments({
    userId: req.user._id,
    quizId,
    status: 'completed'
  });
  
  if (completedAttemptsCount >= quiz.attemptsAllowed) {
    return next(new ApiError(`You have reached the maximum number of attempts (${quiz.attemptsAllowed})`, 403));
  }
  
  const attemptNumber = completedAttemptsCount + 1;
  const expiresAt = quiz.timeLimit > 0 ? new Date(Date.now() + quiz.timeLimit * 60 * 1000) : null;
  
  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    quizId,
    attemptNumber,
    status: 'in_progress',
    startedAt: new Date(),
    expiresAt,
    totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0)
  });
  
  res.status(201).json({ status: 'success', data: attempt });
});

// ✅ تقديم الإجابات مع التحقق من الإجابة على كل الأسئلة
exports.submitAllAnswers = asyncHandler(async (req, res, next) => {
  const { attemptId } = req.params;
  const { answers } = req.body;
  
  const attempt = await QuizAttempt.findById(attemptId).populate('quizId');
  if (!attempt) return next(new ApiError('Attempt not found', 404));
  
  if (attempt.userId.toString() !== req.user._id.toString()) {
    return next(new ApiError('Unauthorized', 403));
  }
  
  if (attempt.status !== 'in_progress') {
    return next(new ApiError('This attempt is already completed', 400));
  }
  
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = 'expired';
    await attempt.save();
    return next(new ApiError('Time limit exceeded. Quiz auto-submitted.', 400));
  }
  
  const quiz = await Quiz.findById(attempt.quizId);
  
  // ✅ التحقق من أن الطالب أجاب على كل الأسئلة
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = answers.length;
  
  if (answeredQuestions !== totalQuestions) {
    return next(new ApiError(`Please answer all questions. Answered: ${answeredQuestions}/${totalQuestions}`, 400));
  }
  
  // ✅ التحقق من أن الأسئلة المرسلة هي نفس أسئلة الكويز (لا يوجد أسئلة مكررة)
  const questionIds = answers.map(a => a.questionId);
  const uniqueQuestionIds = [...new Set(questionIds)];
  
  if (uniqueQuestionIds.length !== totalQuestions) {
    return next(new ApiError('Duplicate answers detected. Please answer each question once.', 400));
  }
  
  let totalScore = 0;
  const answerResults = [];
  
  for (const { questionId, answer } of answers) {
    const question = quiz.questions.id(questionId);
    if (!question) continue;
    
    let isCorrect = false;
    let pointsEarned = 0;
    
    switch (question.type) {
      case 'multiple_choice':
        if (question.options[answer]?.isCorrect) {
          isCorrect = true;
          pointsEarned = question.points;
        }
        break;
      case 'true_false':
        isCorrect = (answer === question.correctAnswer);
        pointsEarned = isCorrect ? question.points : 0;
        break;
      case 'essay':
        pointsEarned = 0;
        break;
    }
    
    totalScore += pointsEarned;
    answerResults.push({ questionId, answer, isCorrect, pointsEarned });
  }
  
  attempt.answers = answerResults;
  attempt.score = totalScore;
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.percentage = (totalScore / attempt.totalPoints) * 100;
  attempt.passed = attempt.percentage >= quiz.passingScore;
  attempt.timeSpent = Math.floor((attempt.completedAt - attempt.startedAt) / 1000);
  
  await attempt.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      answers: answerResults
    }
  });
});

exports.submitAnswer = asyncHandler(async (req, res, next) => {
  const { attemptId, questionId } = req.params;
  const { answer } = req.body;
  
  const attempt = await QuizAttempt.findById(attemptId).populate('quizId');
  if (!attempt) return next(new ApiError('Attempt not found', 404));
  
  if (attempt.userId.toString() !== req.user._id.toString()) {
    return next(new ApiError('Unauthorized', 403));
  }
  
  if (attempt.status !== 'in_progress') {
    return next(new ApiError('This attempt is already completed', 400));
  }
  
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = 'expired';
    await attempt.save();
    return next(new ApiError('Time limit exceeded. Quiz auto-submitted.', 400));
  }
  
  const quiz = await Quiz.findById(attempt.quizId);
  const question = quiz.questions.id(questionId);
  if (!question) return next(new ApiError('Question not found', 404));
  
  let isValidAnswer = false;
  switch (question.type) {
    case 'multiple_choice':
      if (typeof answer === 'number' && answer >= 0 && answer < question.options.length) isValidAnswer = true;
      break;
    case 'true_false':
      if (typeof answer === 'boolean') isValidAnswer = true;
      break;
    case 'essay':
      if (typeof answer === 'string' && answer.trim().length > 0) isValidAnswer = true;
      break;
  }
  
  if (!isValidAnswer) {
    return next(new ApiError(`Invalid answer format for question type: ${question.type}`, 400));
  }
  
  const existingAnswer = attempt.answers.find(a => a.questionId.toString() === questionId);
  if (existingAnswer) {
    return next(new ApiError('Answer already submitted for this question', 400));
  }
  
  let isCorrect = false;
  let pointsEarned = 0;
  let feedback = '';
  
  switch (question.type) {
    case 'multiple_choice':
      if (question.options[answer]?.isCorrect) {
        isCorrect = true;
        pointsEarned = question.points;
      }
      feedback = question.explanation || '';
      break;
    case 'true_false':
      isCorrect = (answer === question.correctAnswer);
      pointsEarned = isCorrect ? question.points : 0;
      feedback = question.explanation || '';
      break;
    case 'essay':
      pointsEarned = 0;
      feedback = 'Your answer has been submitted for review';
      break;
  }
  
  attempt.answers.push({ questionId, answer, isCorrect, pointsEarned, feedback });
  attempt.score += pointsEarned;
  await attempt.save();
  
  res.status(200).json({
    status: 'success',
    data: { isCorrect, pointsEarned, feedback, totalScoreSoFar: attempt.score }
  });
});

exports.completeQuizAttempt = asyncHandler(async (req, res, next) => {
  const { attemptId } = req.params;
  
  const attempt = await QuizAttempt.findById(attemptId).populate('quizId');
  if (!attempt) return next(new ApiError('Attempt not found', 404));
  
  if (attempt.userId.toString() !== req.user._id.toString()) {
    return next(new ApiError('Unauthorized', 403));
  }
  
  if (attempt.status === 'completed') {
    return next(new ApiError('Attempt already completed', 400));
  }
  
  const percentage = (attempt.score / attempt.totalPoints) * 100;
  const passed = percentage >= attempt.quizId.passingScore;
  
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.timeSpent = Math.floor((attempt.completedAt - attempt.startedAt) / 1000);
  
  await attempt.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage,
      passed,
      timeSpent: attempt.timeSpent
    }
  });
});

exports.getUserAttempts = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const attempts = await QuizAttempt.find({ userId: req.user._id, quizId }).sort('-createdAt');
  res.status(200).json({ status: 'success', results: attempts.length, data: attempts });
});

// ==================== لوحة تحكم الأدمن ====================

exports.getQuizAttemptsByAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can view all attempts', 403));
  }
  
  const { quizId } = req.params;
  
  // جلب كل المحاولات
  const attempts = await QuizAttempt.find({ quizId })
    .populate('userId', 'name email')
    .sort('-createdAt');
  
  // ✅ إحصائيات محسنة
  // 1) المحاولات المكتملة فقط (للحسابات)
  const completedAttempts = attempts.filter(a => a.status === 'completed');
  
  // 2) عدد الطلاب الفريدين (كل طالب آخر محاولة له)
  const lastAttemptsByUser = {};
  attempts.forEach(attempt => {
    const userId = attempt.userId._id.toString();
    const isNewer = !lastAttemptsByUser[userId] || 
                    new Date(attempt.createdAt) > new Date(lastAttemptsByUser[userId].createdAt);
    if (isNewer) {
      lastAttemptsByUser[userId] = attempt;
    }
  });
  const uniqueStudents = Object.values(lastAttemptsByUser);
  
  const stats = {
    totalAttempts: attempts.length,  // إجمالي المحاولات (كل المحاولات)
    completedAttempts: completedAttempts.length,  // المحاولات المكتملة
    expiredAttempts: attempts.filter(a => a.status === 'expired').length,  // المنتهية
    inProgressAttempts: attempts.filter(a => a.status === 'in_progress').length,  // الشغالة
    
    // ✅ حسب المحاولات المكتملة فقط
    passed: completedAttempts.filter(a => a.passed).length,
    failed: completedAttempts.filter(a => !a.passed).length,
    averageScore: completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length 
      : 0,
    
    // ✅ حسب الطلاب الفريدين (آخر محاولة لكل طالب)
    uniqueStudentsCount: uniqueStudents.length,
    uniqueStudentsPassed: uniqueStudents.filter(a => a.passed).length,
    uniqueStudentsFailed: uniqueStudents.filter(a => !a.passed && a.status === 'completed').length,
    uniqueStudentsAverageScore: uniqueStudents.length > 0
      ? uniqueStudents.reduce((sum, a) => sum + (a.percentage || 0), 0) / uniqueStudents.length
      : 0
  };
  
  res.status(200).json({
    status: 'success',
    stats,
    data: attempts
  });
});

exports.getAttemptDetails = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can view attempt details', 403));
  }
  
  const { attemptId } = req.params;
  const attempt = await QuizAttempt.findById(attemptId)
    .populate('userId', 'name email')
    .populate('quizId');
  
  if (!attempt) return next(new ApiError('Attempt not found', 404));
  
  const quiz = await Quiz.findById(attempt.quizId);
  
  const detailedAnswers = attempt.answers.map(answer => {
    const question = quiz.questions.id(answer.questionId);
    return {
      questionText: question?.questionText || 'Unknown',
      userAnswer: answer.answer,
      correctAnswer: question?.correctAnswer,
      isCorrect: answer.isCorrect,
      pointsEarned: answer.pointsEarned,
      totalPoints: question?.points || 0,
      explanation: question?.explanation
    };
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      ...attempt.toObject(),
      detailedAnswers
    }
  });
});

// ==================== تمديد مدة المحاولة ====================

exports.extendAttemptTime = asyncHandler(async (req, res, next) => {
  const { attemptId } = req.params;
  const { extraMinutes } = req.body;
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can extend attempt time', 403));
  }
  
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    return next(new ApiError('Attempt not found', 404));
  }
  
  if (attempt.status !== 'in_progress') {
    return next(new ApiError('Cannot extend time for completed attempt', 400));
  }
  
  const currentExpiry = attempt.expiresAt || new Date();
  const newExpiry = new Date(currentExpiry.getTime() + extraMinutes * 60 * 1000);
  attempt.expiresAt = newExpiry;
  
  await attempt.save();
  
  res.status(200).json({
    status: 'success',
    message: `Attempt time extended by ${extraMinutes} minutes`,
    data: {
      attemptId: attempt._id,
      newExpiry: attempt.expiresAt
    }
  });
});

// ✅ إعادة تعيين محاولات الطالب (للأدمن فقط)
exports.resetStudentAttempts = asyncHandler(async (req, res, next) => {
  const { quizId, userId } = req.params;
  const { newAttemptsAllowed } = req.body;
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can reset student attempts', 403));
  }
  
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ApiError('Quiz not found', 404));
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }
  
  // حذف المحاولات المكتملة للطالب
  const deletedCount = await QuizAttempt.deleteMany({
    userId,
    quizId,
    status: 'completed'
  });
  
  // حذف أي محاولات منتهية الصلاحية
  await QuizAttempt.deleteMany({
    userId,
    quizId,
    status: 'expired'
  });
  
  // تحديث عدد المحاولات في الكويز (اختياري)
  if (newAttemptsAllowed) {
    quiz.attemptsAllowed = newAttemptsAllowed;
    await quiz.save();
  }
  
  res.status(200).json({
    status: 'success',
    message: `Student attempts reset. Deleted ${deletedCount.deletedCount} completed attempts.`,
    data: {
      userId,
      quizId,
      newAttemptsAllowed: quiz.attemptsAllowed
    }
  });
});

// ✅ إعادة تنشيط محاولة منتهية (للأدمن فقط)
exports.reactivateExpiredAttempt = asyncHandler(async (req, res, next) => {
  const { attemptId } = req.params;
  const { extraMinutes } = req.body;
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can reactivate attempts', 403));
  }
  
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    return next(new ApiError('Attempt not found', 404));
  }
  
  if (attempt.status !== 'expired') {
    return next(new ApiError('Only expired attempts can be reactivated', 400));
  }
  
  // تغيير الحالة وإضافة وقت جديد
  attempt.status = 'in_progress';
  const newExpiry = new Date(Date.now() + (extraMinutes || 5) * 60 * 1000);
  attempt.expiresAt = newExpiry;
  
  await attempt.save();
  
  res.status(200).json({
    status: 'success',
    message: `Expired attempt reactivated. New expiry: ${newExpiry}`,
    data: attempt
  });
});

// ✅ تمديد الوقت لكل المحاولات الشغالة في كويز معين (للأدمن فقط)
exports.extendAllActiveAttempts = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const { extraMinutes } = req.body;
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can extend all attempts', 403));
  }
  
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ApiError('Quiz not found', 404));
  }
  
  // جلب كل المحاولات الشغالة
  const activeAttempts = await QuizAttempt.find({
    quizId,
    status: 'in_progress'
  });
  
  if (activeAttempts.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No active attempts found to extend',
      data: { extendedCount: 0 }
    });
  }
  
  // تمديد الوقت لكل محاولة
  const extendedAttempts = [];
  for (const attempt of activeAttempts) {
    const currentExpiry = attempt.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry.getTime() + extraMinutes * 60 * 1000);
    attempt.expiresAt = newExpiry;
    await attempt.save();
    extendedAttempts.push({
      attemptId: attempt._id,
      userId: attempt.userId,
      oldExpiry: currentExpiry,
      newExpiry
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: `Extended ${extendedAttempts.length} active attempts by ${extraMinutes} minutes`,
    data: {
      extendedCount: extendedAttempts.length,
      extendedAttempts
    }
  });
});