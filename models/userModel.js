const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Name required'], maxlength: 100 },
    email: { type: String, required: [true, 'Email required'], unique: true, lowercase: true },
    phone: { type: String, required: [true, 'Phone required'] },
    parentPhone: { type: String, required: [true, "Parent's phone required"] },
    profileImg: { type: String, default: null },
    password: { type: String, required: [true, 'Password required'], minlength: 6, select: false },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    role: { type: String, enum: ['user', 'admin','super_admin'], default: 'user' },
    active: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    bannedAt: Date,
  },
  { timestamps: true }
);

// ✅ فهارس محسنة
userSchema.index({ phone: 1 });                    // للبحث برقم الهاتف
userSchema.index({ role: 1, createdAt: -1 });      // لترتيب المستخدمين حسب الدور والتاريخ
userSchema.index({ isBanned: 1 });                  // للبحث عن المحظورين
userSchema.index({ active: 1 });                     // للبحث عن النشطين

// ✅ فهرس نصي محسن (text index) - مهم جدًا للبحث
userSchema.index({ 
  name: 'text', 
  email: 'text' 
}, {
  name: 'user_text_search',  // اسم الفهرس للتوثيق
  weights: {
    name: 10,  // الاسم له أولوية أعلى في البحث
    email: 5   // الإيميل له أولوية أقل
  }
});

// ✅ حل جذري: استخدام document middleware من غير next
userSchema.pre('save', function() {
  console.log('========== FIXED MIDDLEWARE ==========');
  console.log('1. Password modified?', this.isModified('password'));
  
  // الباسورد مش متغير، نخرج من غير ما نعمل حاجة
  if (!this.isModified('password')) {
    console.log('2. Password not modified, exiting');
    return;
  }
  
  try {
    console.log('3. Hashing password...');
    // bcrypt بالطريقة المتزامنة (sync)
    this.password = bcrypt.hashSync(this.password, 12);
    console.log('4. Password hashed successfully');
    
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
      console.log('5. passwordChangedAt updated');
    }
    
    console.log('6. Middleware completed successfully');
    
  } catch (error) {
    console.log('7. Error in middleware:', error.message);
    // مش ممكن نستخدم next، هنرمي الخطأ
    throw error;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;