const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Grade name is required'],
      unique: true,
      trim: true,
    },
    level: {
      type: Number,
      required: [true, 'Grade level is required'],
      min: 1,
      max: 12,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

gradeSchema.index({ level: 1 });
gradeSchema.index({ order: 1 });

const Grade = mongoose.models.Grade || mongoose.model('Grade', gradeSchema);
module.exports = Grade;