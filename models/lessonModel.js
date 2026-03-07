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
    
    content: {
      videoUrl: {
        type: String,
        trim: true,
      },
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
    
    isFree: {
      type: Boolean,
      default: false,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ Middleware للتحقق من وجود القسم وملء gradeId تلقائيًا
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

    callback();
  } catch (error) {
    callback(error);
  }
});

lessonSchema.index({ sectionId: 1, order: 1 });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;