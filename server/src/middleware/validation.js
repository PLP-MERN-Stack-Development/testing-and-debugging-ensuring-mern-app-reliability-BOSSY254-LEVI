const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  handleValidationErrors,
];

const validateUserLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors,
];

// Post validation rules
const validatePostCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),

  body('category')
    .isMongoId()
    .withMessage('Please provide a valid category ID'),

  handleValidationErrors,
];

const validatePostUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),

  body('category')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid category ID'),

  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),

  handleValidationErrors,
];

// Comment validation rules
const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),

  handleValidationErrors,
];

// Category validation rules
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),

  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),

  handleValidationErrors,
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid ID'),

  handleValidationErrors,
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors,
];

const validatePostFilters = [
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid ID'),

  query('author')
    .optional()
    .isMongoId()
    .withMessage('Author must be a valid ID'),

  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),

  handleValidationErrors,
];

// Custom validation middleware for business logic
const validateUniqueEmail = (req, res, next) => {
  const User = require('../models/User');

  User.findOne({ email: req.body.email })
    .then(user => {
      if (user && user._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
      next();
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Server error during email validation',
      });
    });
};

const validateUniqueUsername = (req, res, next) => {
  const User = require('../models/User');

  User.findOne({ username: req.body.username })
    .then(user => {
      if (user && user._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists',
        });
      }
      next();
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Server error during username validation',
      });
    });
};

const validateCategoryExists = (req, res, next) => {
  const Category = require('../models/Category');

  Category.findById(req.body.category)
    .then(category => {
      if (!category || !category.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Category does not exist or is inactive',
        });
      }
      next();
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Server error during category validation',
      });
    });
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePostCreation,
  validatePostUpdate,
  validateComment,
  validateCategory,
  validateObjectId,
  validatePagination,
  validatePostFilters,
  validateUniqueEmail,
  validateUniqueUsername,
  validateCategoryExists,
};
