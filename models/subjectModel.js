const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    hasSections: {
      type: Boolean,
      default: false,  // true للمواد اللي ليها أقسام (زي العربي)
    },
    image: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;