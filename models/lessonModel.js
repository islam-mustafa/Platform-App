const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Lesson must belong to a section'],
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    // ✅ فيديو Cloudinary (الحقيقي)
    videos: [{
      publicId: { type: String, required: true },
      hlsUrl: { type: String },
      mp4Url: { type: String },
      duration: { type: Number, default: 0 },
      thumbnail: { type: String },
      title: { type: String, default: 'فيديو' },
      order: { type: Number, default: 0 },
      processingStatus: { 
        type: String, 
        enum: ['pending', 'processing', 'ready', 'failed'],
        default: 'pending'
      },
      processingError: { type: String },
      eagerNotificationUrl: { type: String } // للتتبع
    }],
    
    // ✅ حقول الدفع
    isPremium: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'EGP',
    },
    
    // ✅ المحتوى النصي والملفات
    content: {
      text: {
        type: String,
        trim: true,
      },
      attachments: [{
        type: String,
        trim: true,
      }],
      duration: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    
    // ✅ ربط الكويز (علاقة مع موديل Quiz)
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      index: true,
      default: null
    },
    
    // ✅ الواجب
    assignment: {
      isEnabled: { type: Boolean, default: false },
      dueDate: Date,
      instructions: String,
      attachments: [String],
      submissionType: { 
        type: String, 
        enum: ['file', 'text', 'both'],
        default: 'file'
      }
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ Middleware للتحقق من وجود القسم
lessonSchema.pre('validate', async function() {
  let next = null;
  for (let i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === 'function') {
      next = arguments[i];
      break;
    }
  }

  const callback = typeof next === 'function' ? next : (err) => {
    if (err) throw err;
  };

  try {
    const Section = mongoose.model('Section');
    const section = await Section.findById(this.sectionId);
    
    if (!section) {
      return callback(new Error('Section not found'));
    }

    // ✅ التحقق من أن الدرس المدفوع له سعر
    if (this.isPremium && (!this.price || this.price <= 0)) {
      return callback(new Error('Premium lessons must have a price'));
    }

    callback();
  } catch (error) {
    callback(error);
  }
});

lessonSchema.index({ sectionId: 1, order: 1 });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;