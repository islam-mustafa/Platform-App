const mongoose = require('mongoose');

const studentLessonSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    lessonId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Lesson', 
      required: true,
      index: true 
    },
    
    // ✅ حالة الوصول
    hasAccess: { type: Boolean, default: false },
    purchaseDate: Date,
    purchasePrice: Number, // السعر عند الشراء
    purchaseCurrency: { type: String, default: 'EGP' },
    
    accessCount: { type: Number, default: 0 },      // عدد مرات فتح الدرس
    refreshCount: { type: Number, default: 0 },      // عدد مرات تجديد الرابط
    lastAccess: Date,                                 // آخر مرة فتح

    // ✅ تقدم المشاهدة
    watchedAt: Date,
    completedAt: Date,
    lastPosition: { type: Number, default: 0 }, // آخر ثانية في الفيديو
    watchPercentage: { type: Number, default: 0, min: 0, max: 100 },
    
    // ✅ الكويز
    quizAttempts: [{
      attemptNumber: { type: Number, required: true },
      startedAt: { type: Date, default: Date.now },
      completedAt: Date,
      answers: [{
        questionId: { type: String, required: true },
        answer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        pointsEarned: { type: Number, default: 0 }
      }],
      score: { type: Number, default: 0 },
      passed: { type: Boolean, default: false },
      timeSpent: Number // بالثواني
    }],
    
    // ✅ أفضل محاولة في الكويز
    bestQuizScore: { type: Number, default: 0 },
    quizPassed: { type: Boolean, default: false },
    
    // ✅ الواجب
    assignmentSubmissions: [{
      submissionNumber: { type: Number, required: true },
      submittedAt: { type: Date, default: Date.now },
      content: String, // لو submissionType = text
      fileUrl: String, // لو submissionType = file
      grade: Number, // درجة الواجب
      feedback: String,
      gradedAt: Date,
      gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    
    // ✅ أفضل درجة في الواجب
    bestAssignmentGrade: { type: Number, default: 0 },
    assignmentGraded: { type: Boolean, default: false },
    
    // ✅ حالة إكمال الدرس (تتغير لما يكمل مشاهدة + كويز + واجب)
    completed: { type: Boolean, default: false },
    completedAt: Date,
    
    // ✅ ملاحظات عامة
    notes: String
  },
  { timestamps: true }
);

// ✅ Indexes للبحث السريع
studentLessonSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
studentLessonSchema.index({ userId: 1, completed: 1 });
studentLessonSchema.index({ lessonId: 1, hasAccess: 1 });

// ✅ Middleware لتعيين attemptNumber تلقائيًا
studentLessonSchema.pre('save', function(next) {
  if (this.quizAttempts && this.quizAttempts.length > 0) {
    const lastAttempt = this.quizAttempts[this.quizAttempts.length - 1];
    if (!lastAttempt.attemptNumber) {
      lastAttempt.attemptNumber = this.quizAttempts.length;
    }
  }
  
  if (this.assignmentSubmissions && this.assignmentSubmissions.length > 0) {
    const lastSubmission = this.assignmentSubmissions[this.assignmentSubmissions.length - 1];
    if (!lastSubmission.submissionNumber) {
      lastSubmission.submissionNumber = this.assignmentSubmissions.length;
    }
  }
  
  next();
});

const StudentLesson = mongoose.models.StudentLesson || mongoose.model('StudentLesson', studentLessonSchema);
module.exports = StudentLesson;