const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateProfileUpdate 
} = require('../middleware/validation');
const { uploadProfilePicture, handleUploadError } = require('../middleware/upload');

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:resetToken', authController.resetPassword);
router.post('/verify-email/:verificationToken', authController.verifyEmail);

// Protected routes
router.use(protect); // All routes below this require authentication

router.get('/me', authController.getMe);
router.put('/profile', validateProfileUpdate, authController.updateProfile);
router.put('/avatar', uploadProfilePicture, handleUploadError, authController.updateAvatar);
router.put('/password', authController.updatePassword);
router.delete('/avatar', authController.deleteAvatar);
router.post('/logout', authController.logout);

// Admin only routes
router.get('/users', authorize('admin'), authController.getAllUsers);
router.put('/users/:id/verify', authorize('admin'), authController.verifyUser);
router.put('/users/:id/deactivate', authorize('admin'), authController.deactivateUser);

module.exports = router; 