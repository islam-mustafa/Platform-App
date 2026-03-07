const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Section must belong to a subject'],
      index: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: [true, 'Section must belong to a grade'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Middleware للتحقق
sectionSchema.pre('save', async function() {
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
    const Subject = mongoose.model('Subject');
    const Grade = mongoose.model('Grade');
    
    const subject = await Subject.findById(this.subjectId);
    if (!subject) {
      return callback(new Error('Subject not found'));
    }

    const grade = await Grade.findById(this.gradeId);
    if (!grade) {
      return callback(new Error('Grade not found'));
    }

    if (!this.isDefault && !subject.hasSections) {
      return callback(new Error(`Cannot add sections to subject "${subject.name}" because it does not support sections`));
    }

    callback();
  } catch (error) {
    callback(error);
  }
});

sectionSchema.index({ subjectId: 1, gradeId: 1, order: 1 });

const Section = mongoose.models.Section || mongoose.model('Section', sectionSchema);
module.exports = Section;