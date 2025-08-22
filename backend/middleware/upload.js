const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'foodshare',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  }
});

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
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'foodshare/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ]
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB for profile pictures
  }
}).single('avatar');

// Food images upload middleware
const uploadFoodImages = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'foodshare/food',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    }
  }),
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

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return;
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to delete multiple images
const deleteMultipleImages = async (publicIds) => {
  try {
    if (!publicIds || !Array.isArray(publicIds)) return;
    
    const deletePromises = publicIds.map(publicId => deleteImage(publicId));
    const results = await Promise.allSettled(deletePromises);
    
    return results;
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw error;
  }
};

// Helper function to optimize image before upload
const optimizeImage = async (imageBuffer, options = {}) => {
  try {
    const { width = 800, height = 600, quality = 'auto:good' } = options;
    
    const result = await cloudinary.uploader.upload_stream({
      transformation: [
        { width, height, crop: 'limit' },
        { quality }
      ]
    }, (error, result) => {
      if (error) throw error;
      return result;
    }).end(imageBuffer);
    
    return result;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

// Helper function to get image info
const getImageInfo = async (publicId) => {
  try {
    if (!publicId) return null;
    
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
};

// Helper function to generate image URL with transformations
const generateImageUrl = (publicId, transformations = []) => {
  if (!publicId) return null;
  
  const baseUrl = cloudinary.url(publicId);
  
  if (transformations.length === 0) {
    return baseUrl;
  }
  
  // Apply transformations
  const transformString = transformations
    .map(transform => {
      const parts = [];
      if (transform.width) parts.push(`w_${transform.width}`);
      if (transform.height) parts.push(`h_${transform.height}`);
      if (transform.crop) parts.push(`c_${transform.crop}`);
      if (transform.quality) parts.push(`q_${transform.quality}`);
      if (transform.gravity) parts.push(`g_${transform.gravity}`);
      return parts.join(',');
    })
    .filter(Boolean)
    .join('/');
  
  return `${baseUrl.split('/upload/')[0]}/upload/${transformString}/${baseUrl.split('/upload/')[1]}`;
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
  generateImageUrl,
  cloudinary
}; 