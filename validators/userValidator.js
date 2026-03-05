const { check } = require('express-validator');
const mongoose = require('mongoose');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const User = require('../models/userModel');

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

exports.updateMeValidator = [
  check('name').optional().isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  check('phone').optional().isMobilePhone(['ar-EG', 'ar-SA']).withMessage('Invalid phone number'),
  check('parentPhone').optional().isMobilePhone(['ar-EG', 'ar-SA']).withMessage('Invalid parent phone number'),
  validatorMiddleware,
];

exports.changeMyPasswordValidator = [
  check('currentPassword').notEmpty().withMessage('Current password is required'),
  check('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value !== req.body.passwordConfirm) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  check('passwordConfirm').notEmpty().withMessage('Password confirmation is required'),
  validatorMiddleware,
];

exports.userIdValidator = [
  check('id').custom((value) => {
    if (!isMongoId(value)) throw new Error('Invalid user id');
    return true;
  }),
  validatorMiddleware,
];

exports.createUserValidator = [
  check('name').notEmpty().withMessage('Name is required').isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(async (value) => {
      const existing = await User.findOne({ email: value.toLowerCase() });
      if (existing) throw new Error('Email already exists');
      return true;
    }),
  check('phone').notEmpty().withMessage('Phone is required').isMobilePhone(['ar-EG', 'ar-SA']).withMessage('Invalid phone number'),
  check('parentPhone').notEmpty().withMessage('Parent phone is required').isMobilePhone(['ar-EG', 'ar-SA']).withMessage('Invalid parent phone number'),
  check('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('role').optional().isIn(['user', 'instructor', 'admin']).withMessage('Invalid role'),
  validatorMiddleware,
  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required'),

  validatorMiddleware,
];

exports.updateUserValidator = [
  check('id').custom((value) => {
    if (!isMongoId(value)) throw new Error('Invalid user id');
    return true;
  }),
  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .custom(async (value, { req }) => {
      const existing = await User.findOne({ email: value.toLowerCase() });
      if (existing && existing._id.toString() !== req.params.id) {
        throw new Error('Email already exists');
      }
      return true;
    }),
  check('phone').optional().isMobilePhone(['ar-EG', 'ar-SA']).withMessage('Invalid phone number'),
  check('parentPhone').optional().isMobilePhone(['ar-EG', 'ar-SA']).withMessage('Invalid parent phone number'),
  check('role').optional().isIn(['user', 'instructor', 'admin']).withMessage('Invalid role'),
  validatorMiddleware,
];
