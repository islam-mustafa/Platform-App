const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subjectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Subject', 
      required: true,
      index: true 
    },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sectionSchema.index({ name: 1, subjectId: 1 }, { unique: true });


// ✅ الحل: استخدام arguments
sectionSchema.pre('save', async function() {
  console.log('========== SECTION MIDDLEWARE (FIXED) ==========');
  
  // 1) استخرج next من arguments
  let next = null;
  for (let i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === 'function') {
      next = arguments[i];
      console.log(`✅ Found next at position ${i}`);
      break;
    }
  }
  
  if (typeof next !== 'function') {
    console.error('❌ No next function found in arguments');
    return;
  }

  try {
    console.log('1. this.subjectId:', this.subjectId);
    
    const Subject = require('./subjectModel');
    const subject = await Subject.findById(this.subjectId);
    
    if (!subject) {
      console.log('2. ❌ Subject not found');
      return next(new Error('Subject not found'));
    }
    
    console.log('3. Subject found:', subject.name);
    console.log('4. Subject hasSections:', subject.hasSections);
    
    if (!subject.hasSections) {
      console.log('5. ❌ Subject does not support sections');
      return next(new Error(`Subject "${subject.name}" does not support sections`));
    }
    
    console.log('6. ✅ All good, calling next()');
    next();
  } catch (error) {
    console.error('7. ❌ Error:', error.message);
    next(error);
  }
});

sectionSchema.index({ subjectId: 1, order: 1 });

const Section = mongoose.model('Section', sectionSchema);
module.exports = Section;