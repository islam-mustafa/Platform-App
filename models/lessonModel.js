const mongoose = require('mongoose');
const Subject = require('./subjectModel');
const Section = require('./sectionModel');

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    
    // إما subjectId أو sectionId
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', index: true },

    order: { type: Number, default: 0 },
    content: {
      videoUrl: String,
      text: String,
      attachments: [String],
      duration: Number,
    },
    isFree: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ التحقق: التأكد من توافق الدرس مع نوع المادة
lessonSchema.pre('validate', async function(next) {
  const hasSubject = !!this.subjectId;
  const hasSection = !!this.sectionId;

  // 1) لازم يكون واحد فقط موجود
  if ((hasSubject && hasSection) || (!hasSubject && !hasSection)) {
    return next(new Error('Lesson must belong to either a subject or a section'));
  }

  try {
    if (hasSubject) {
      // درس تحت مادة مباشرة (زي الكيمياء)
      const subject = await Subject.findById(this.subjectId);
      if (!subject) return next(new Error('Subject not found'));
      
      // لو المادة ليها أقسام، مينفعش درس يكون تحت المادة مباشرة
      if (subject.hasSections) {
        return next(new Error(`Subject "${subject.name}" has sections. Lessons must be under a section`));
      }
    }

    if (hasSection) {
      // درس تحت قسم (زي العربي)
      const section = await Section.findById(this.sectionId).populate('subjectId');
      if (!section) return next(new Error('Section not found'));
      
      // لو المادة ملهاش أقسام، مينفعش درس يكون تحت قسم
      if (!section.subjectId.hasSections) {
        return next(new Error(`Subject "${section.subjectId.name}" does not have sections. Cannot add lesson to section`));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

lessonSchema.index({ subjectId: 1, order: 1 });
lessonSchema.index({ sectionId: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);