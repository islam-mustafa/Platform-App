// models/assignmentModel.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    // ربط الواجب بالدرس
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Assignment must belong to a lesson'],
    },
    
    // معلومات الواجب
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    instructions: {
      type: String,
      trim: true
    },
    
    // إعدادات التسليم
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    submissionType: {
      type: String,
      enum: ['file', 'text', 'both'],
      default: 'file'
    },
    allowedFileTypes: [{
      type: String,
      enum: ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip']
    }],
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB
    },
    
    // إعدادات التقييم
    maxPoints: {
      type: Number,
      required: [true, 'Max points is required'],
      min: 1,
      default: 100
    },
    passingPoints: {
      type: Number,
      min: 0,
      default: 60
    },
    
    // حالة الواجب
    isActive: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    
    // ملفات مساعدة
    attachments: [{
      filename: {
        type: String,
        required: true,
        trim: true
      },
      extension: {
        type: String,
        required: true,
        lowercase: true
      },
      mimeType: {
        type: String,
        trim: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      },
      publicId: {
        type: String,
        trim: true
      },
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

assignmentSchema.index({ lessonId: 1 });
assignmentSchema.index({ dueDate: 1 });

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;