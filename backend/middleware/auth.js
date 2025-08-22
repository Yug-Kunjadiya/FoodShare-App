const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Optional authentication - user can be authenticated but not required
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token is invalid, but we continue without user
      req.user = null;
    }
  }

  next();
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

// Check if user owns the resource
const checkOwnership = (model, fieldName = 'user') => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      if (resource[fieldName].toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error while checking ownership'
      });
    }
  };
};

// Rate limiting for specific actions
const rateLimit = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?._id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      requests.set(userId, requests.get(userId).filter(time => time > windowStart));
    }

    const userRequests = requests.get(userId) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

// Validate user location
const validateLocation = (req, res, next) => {
  const { coordinates } = req.body.location || {};
  
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({
      success: false,
      message: 'Valid coordinates are required (longitude, latitude)'
    });
  }

  const [lng, lat] = coordinates;
  
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90'
    });
  }

  next();
};

// Check if user has verified profile
const requireVerifiedProfile = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Profile verification required to access this resource'
    });
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  checkOwnership,
  rateLimit,
  validateLocation,
  requireVerifiedProfile
}; 