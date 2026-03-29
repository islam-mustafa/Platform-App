// models/submissionModel.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    // من الطالب؟
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    
    // أي واجب؟
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment ID is required'],
      index: true
    },
    
    // المحتوى المسلّم
    content: {
      type: String,
      trim: true
    },
    attachments: [{
      type: String,
      trim: true
    }],
    
    // حالة التسليم
    status: {
      type: String,
      enum: ['draft', 'submitted', 'graded', 'late'],
      default: 'draft'
    },
    
    submittedAt: {
      type: Date,
      default: null
    },
    
    // التقييم
    grade: {
      type: Number,
      min: 0,
      default: null
    },
    feedback: {
      type: String,
      trim: true
    },
    gradedAt: {
      type: Date,
      default: null
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // ملاحظات
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// ✅ منع تكرار التسليم لنفس الواجب
submissionSchema.index({ userId: 1, assignmentId: 1 }, { unique: true });

// ✅ الفهرس حسب حالة التسليم
submissionSchema.index({ assignmentId: 1, status: 1 });
submissionSchema.index({ userId: 1, status: 1 });

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
module.exports = Submission;