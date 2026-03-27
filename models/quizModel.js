const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    // ✅ ربط الكويز بالدرس (واحد لواحد)
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Quiz must belong to a lesson'],
      unique: true, // درس واحد لكل كويز
      index: true
    },

    // ✅ معلومات الكويز
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    // ✅ إعدادات الكويز
    timeLimit: {
      type: Number,
      default: 0, // 0 = غير محدد
      min: 0,
      help: 'Time limit in minutes'
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
      help: 'Percentage required to pass'
    },
    attemptsAllowed: {
      type: Number,
      default: 3,
      min: 1,
      help: 'Number of attempts allowed'
    },

    // ✅ إعدادات العرض
    shuffleQuestions: {
      type: Boolean,
      default: false,
      help: 'Randomize question order'
    },
    showResults: {
      type: Boolean,
      default: true,
      help: 'Show correct answers after completion'
    },

    // ✅ الأسئلة
    questions: [{
      questionText: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
      },
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'essay'],
        default: 'multiple_choice'
      },
      points: {
        type: Number,
        default: 1,
        min: 0
      },
      // للاختيار من متعدد
      options: [{
        text: {
          type: String,
          required: function() {
            return this.parent().type === 'multiple_choice';
          }
        },
        isCorrect: {
          type: Boolean,
          default: false
        }
      }],
      // للإجابة الصحيحة (للصح/خطأ وللاختيار من متعدد)
      correctAnswer: {
        type: mongoose.Schema.Types.Mixed,
        help: 'For true/false: boolean, for multiple_choice: option index, for essay: model answer'
      },
      // شرح الإجابة (يظهر بعد الحل)
      explanation: {
        type: String,
        trim: true
      },
      order: {
        type: Number,
        default: 0
      }
    }],

    // ✅ حالة الكويز
    isActive: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// ✅ التأكد من وجود lessonId
quizSchema.index({ lessonId: 1 }, { unique: true });

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
module.exports = Quiz;