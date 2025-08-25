const multer = require('multer');
const path = require('path');

// Simple memory storage for testing
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.'), false);
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return cb(new Error('File too large. Maximum size is 5MB.'), false);
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files per request
  }
});

// Single image upload middleware
const uploadSingle = upload.single('image');

// Multiple images upload middleware
const uploadMultiple = upload.array('images', 5);

// Profile picture upload middleware
const uploadProfilePicture = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB for profile pictures
  }
}).single('avatar');

// Food images upload middleware
const uploadFoodImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
}).array('images', 5);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Helper function to delete image (placeholder for now)
const deleteImage = async (publicId) => {
  console.log('Image deletion would happen here for:', publicId);
  return { result: 'ok' };
};

// Helper function to delete multiple images
const deleteMultipleImages = async (publicIds) => {
  console.log('Multiple image deletion would happen here for:', publicIds);
  return [{ result: 'ok' }];
};

// Helper function to optimize image (placeholder)
const optimizeImage = async (imageBuffer, options = {}) => {
  console.log('Image optimization would happen here');
  return { url: 'placeholder-url' };
};

// Helper function to get image info (placeholder)
const getImageInfo = async (publicId) => {
  console.log('Getting image info for:', publicId);
  return { format: 'jpg', width: 800, height: 600 };
};

// Helper function to generate image URL (placeholder)
const generateImageUrl = (publicId, transformations = []) => {
  console.log('Generating URL for:', publicId, 'with transformations:', transformations);
  return 'https://example.com/placeholder.jpg';
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadProfilePicture,
  uploadFoodImages,
  handleUploadError,
  deleteImage,
  deleteMultipleImages,
  optimizeImage,
  getImageInfo,
  generateImageUrl
};
