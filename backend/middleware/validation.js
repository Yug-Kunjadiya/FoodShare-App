const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const firstError = errorArray[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      errors: errorArray.map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['donor', 'receiver'])
    .withMessage('Role must be either donor or receiver'),
  
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array with exactly 2 values [longitude, latitude]'),
  
  body('location.coordinates.*')
    .isFloat()
    .withMessage('Coordinates must be valid numbers'),
  
  body('location.coordinates.0')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.coordinates.1')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// User profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array with exactly 2 values'),
  
  body('preferences.maxDistance')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Max distance must be between 1 and 100 kilometers'),
  
  handleValidationErrors
];

// Food creation validation
const validateFoodCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('foodType')
    .isIn(['vegetarian', 'non-vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'other'])
    .withMessage('Invalid food type'),
  
  body('category')
    .isIn(['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'beverages', 'other'])
    .withMessage('Invalid food category'),
  
  body('quantity.amount')
    .isFloat({ min: 1 })
    .withMessage('Quantity amount must be at least 1'),
  
  body('quantity.unit')
    .isIn(['servings', 'pieces', 'kg', 'grams', 'liters', 'packets', 'other'])
    .withMessage('Invalid quantity unit'),
  
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array with exactly 2 values [longitude, latitude]'),
  
  body('location.coordinates.*')
    .isFloat()
    .withMessage('Coordinates must be valid numbers'),
  
  body('availability.pickupTime.start')
    .isISO8601()
    .withMessage('Pickup start time must be a valid date'),
  
  body('availability.pickupTime.end')
    .isISO8601()
    .withMessage('Pickup end time must be a valid date')
    .custom((endTime, { req }) => {
      const startTime = new Date(req.body.availability.pickupTime.start);
      const end = new Date(endTime);
      if (end <= startTime) {
        throw new Error('Pickup end time must be after start time');
      }
      return true;
    }),
  
  body('availability.expiryTime')
    .isISO8601()
    .withMessage('Expiry time must be a valid date')
    .custom((expiryTime, { req }) => {
      const endTime = new Date(req.body.availability.pickupTime.end);
      const expiry = new Date(expiryTime);
      if (expiry <= endTime) {
        throw new Error('Expiry time must be after pickup end time');
      }
      return true;
    }),
  
  body('dietaryInfo.allergens.*')
    .optional()
    .isIn(['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'none'])
    .withMessage('Invalid allergen type'),
  
  handleValidationErrors
];

// Food update validation
const validateFoodUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('foodType')
    .optional()
    .isIn(['vegetarian', 'non-vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'other'])
    .withMessage('Invalid food type'),
  
  body('category')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'beverages', 'other'])
    .withMessage('Invalid food category'),
  
  handleValidationErrors
];

// Request creation validation
const validateRequestCreation = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  
  body('requestedQuantity.amount')
    .isFloat({ min: 1 })
    .withMessage('Requested quantity amount must be at least 1'),
  
  body('requestedQuantity.unit')
    .isIn(['servings', 'pieces', 'kg', 'grams', 'liters', 'packets', 'other'])
    .withMessage('Invalid quantity unit'),
  
  body('pickupDetails.preferredTime')
    .isISO8601()
    .withMessage('Preferred pickup time must be a valid date')
    .custom((time) => {
      const pickupTime = new Date(time);
      const now = new Date();
      if (pickupTime <= now) {
        throw new Error('Pickup time must be in the future');
      }
      return true;
    }),
  
  body('pickupDetails.alternativeTime')
    .optional()
    .isISO8601()
    .withMessage('Alternative pickup time must be a valid date'),
  
  handleValidationErrors
];

// Request response validation
const validateRequestResponse = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Response message cannot exceed 500 characters'),
  
  body('proposedPickupTime')
    .optional()
    .isISO8601()
    .withMessage('Proposed pickup time must be a valid date'),
  
  handleValidationErrors
];

// Chat message validation
const validateChatMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'location', 'file'])
    .withMessage('Invalid message type'),
  
  handleValidationErrors
];

// Search and filter validation
const validateSearchFilters = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('foodType')
    .optional()
    .isIn(['vegetarian', 'non-vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'other'])
    .withMessage('Invalid food type filter'),
  
  query('category')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'beverages', 'other'])
    .withMessage('Invalid food category filter'),
  
  query('maxDistance')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Max distance must be between 1 and 100 kilometers'),
  
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page number must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateFoodCreation,
  validateFoodUpdate,
  validateRequestCreation,
  validateRequestResponse,
  validateChatMessage,
  validateSearchFilters,
  validateId
}; 