const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Quiz must belong to a lesson'],
      unique: true,  // ✅ هذا ينشئ index تلقائياً
    },
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
    timeLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    attemptsAllowed: {
      type: Number,
      default: 3,
      min: 1
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
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
      correctAnswer: {
        type: mongoose.Schema.Types.Mixed
      },
      explanation: {
        type: String,
        trim: true
      },
      order: {
        type: Number,
        default: 0
      }
    }],
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

// ✅ لا تحتاج هذا السطر (لأن unique: true يخلق index تلقائياً)
// quizSchema.index({ lessonId: 1 }, { unique: true });

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
module.exports = Quiz;