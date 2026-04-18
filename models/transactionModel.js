const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_METHODS, CURRENCY } = require('../utils/constants');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson ID is required'],
      index: true
    },
    
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0
    },
    
    currency: {
      type: String,
      default: CURRENCY.EGP,
      uppercase: true,
      trim: true
    },
    
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: [true, 'Payment method is required']
    },
    
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true
    },
    
    paymobTransactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    
    paymobOrderId: {
      type: String,
      index: true
    },
    
    idempotencyKey: {
      type: String,
      unique: true,
      index: true
    },
    
    completedAt: {
      type: Date
    },
    
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, lessonId: 1 });
transactionSchema.index({ status: 1, createdAt: 1 });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;