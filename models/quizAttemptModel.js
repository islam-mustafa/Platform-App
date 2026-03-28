const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
      index: true
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'expired'],
      default: 'in_progress'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      answer: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      isCorrect: {
        type: Boolean,
        default: false
      },
      pointsEarned: {
        type: Number,
        default: 0
      },
      feedback: {
        type: String,
        trim: true
      }
    }],
    score: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    passed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true,
    indexes: [
      { userId: 1, quizId: 1, status: 1 }
    ]
  }
);

quizAttemptSchema.index({ userId: 1, quizId: 1, attemptNumber: 1 }, { unique: true });
quizAttemptSchema.index({ quizId: 1, passed: 1 });
quizAttemptSchema.index({ completedAt: -1 });

const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);
module.exports = QuizAttempt;