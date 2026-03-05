const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const User = require('../models/userModel');

exports.signupValidator = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),

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

  check('phone')
    .notEmpty()
    .withMessage('Phone is required')
    .isMobilePhone(['ar-EG', 'ar-SA'])
    .withMessage('Invalid phone number'),

  check('parentPhone')
    .notEmpty()
    .withMessage('Parent phone is required')
    .isMobilePhone(['ar-EG', 'ar-SA'])
    .withMessage('Invalid parent phone number'),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value !== req.body.passwordConfirm) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required'),

  validatorMiddleware,
];

exports.loginValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  check('password').notEmpty().withMessage('Password is required'),

  validatorMiddleware,
];

exports.refreshTokenValidator = [
  check('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validatorMiddleware,
];

exports.logoutValidator = [
  check('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validatorMiddleware,
];

exports.forgotPasswordValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  validatorMiddleware,
];

exports.verifyResetCodeValidator = [
  check('resetCode')
    .notEmpty()
    .withMessage('Reset code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 characters'),
  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

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

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required'),

  validatorMiddleware,
];
