const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    // كود الخصم (اللي هيكتبه المستخدم)
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    
    // نوع الخصم
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required']
    },
    
    // قيمة الخصم
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0
    },
    
    // الحد الأقصى للخصم (لـ percentage فقط)
    maxDiscountAmount: {
      type: Number,
      min: 0,
      default: null,
      help: 'Maximum discount amount for percentage coupons'
    },
    
    // أقل مبلغ للطلب عشان يشتغل الكوبون
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // تاريخ بدء الصلاحية
    startDate: {
      type: Date,
      default: Date.now
    },
    
    // تاريخ انتهاء الصلاحية
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    
    // الحد الأقصى لعدد مرات الاستخدام (لكل الكوبون)
    usageLimit: {
      type: Number,
      default: null,
      min: 1
    },
    
    // عدد مرات الاستخدام الحالية
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // حد أقصى لكل مستخدم
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1
    },
    
    // المستخدمين اللي استخدموا الكوبون
    usedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      usedAt: {
        type: Date,
        default: Date.now
      },
      orderId: {
        type: String
      }
    }],
    
    // الدروس اللي الكوبون شغال عليها (فارغ = كل الدروس)
    applicableLessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }],
    
    // هل الكوبون نشط؟
    isActive: {
      type: Boolean,
      default: true
    },
    
    // وصف الكوبون (للأدمن)
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// ✅ التحقق من صلاحية الكوبون (مش منتهي)
couponSchema.methods.isExpired = function() {
  const now = new Date();
  return now < this.startDate || now > this.endDate;
};

// ✅ التحقق من أن الكوبون لسه فيه استخدام متاح
couponSchema.methods.hasUsageLeft = function() {
  if (this.usageLimit === null) return true;
  return this.usageCount < this.usageLimit;
};

// ✅ التحقق من أن المستخدم ما استخدمش الكوبون قبل كده (زيادة عن المسموح)
couponSchema.methods.canUserUse = function(userId) {
  const userUsedCount = this.usedBy.filter(u => u.userId.toString() === userId.toString()).length;
  return userUsedCount < this.perUserLimit;
};

// ✅ حساب السعر بعد الخصم
couponSchema.methods.calculateDiscount = function(originalAmount) {
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = originalAmount * (this.discountValue / 100);
    // تطبيق الحد الأقصى للخصم (لو موجود)
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    discountAmount = this.discountValue;
    // الخصم ما يزيدش عن السعر الأصلي
    if (discountAmount > originalAmount) {
      discountAmount = originalAmount;
    }
  }
  
  return {
    discountAmount,
    finalAmount: originalAmount - discountAmount
  };
};

// ✅ التحقق من أن الكوبون ينطبق على الدرس
couponSchema.methods.appliesToLesson = function(lessonId) {
  if (!this.applicableLessons || this.applicableLessons.length === 0) {
    return true; // الكوبون ينطبق على كل الدروس
  }
  return this.applicableLessons.some(id => id.toString() === lessonId.toString());
};

// ✅ تسجيل استخدام الكوبون
couponSchema.methods.markAsUsed = async function(userId, orderId) {
  this.usageCount += 1;
  this.usedBy.push({
    userId,
    usedAt: new Date(),
    orderId
  });
  await this.save();
};

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
module.exports = Coupon;