const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { deleteImage } = require('../middleware/upload');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      organization: user.organization
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role, location, organization } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'receiver',
    location,
    organization
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // Update last active
  user.updateLastActive();

  sendTokenResponse(user, 200, res);
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('organization');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, location, organization, preferences } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (location) user.location = location;
  if (organization) user.organization = organization;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// @desc    Update user avatar
// @route   PUT /api/auth/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  const user = await User.findById(req.user._id);

  // Delete old avatar if exists
  if (user.avatar && user.avatar.includes('cloudinary')) {
    const publicId = user.avatar.split('/').pop().split('.')[0];
    await deleteImage(publicId);
  }

  // Update avatar
  user.avatar = req.file.path;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully',
    data: {
      avatar: user.avatar
    }
  });
});

// @desc    Delete user avatar
// @route   DELETE /api/auth/avatar
// @access  Private
const deleteAvatar = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user.avatar) {
    return next(new AppError('No avatar to delete', 400));
  }

  // Delete from Cloudinary if exists
  if (user.avatar.includes('cloudinary')) {
    const publicId = user.avatar.split('/').pop().split('.')[0];
    await deleteImage(publicId);
  }

  // Remove avatar
  user.avatar = '';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Avatar deleted successfully'
  });
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // TODO: Send email with reset token
  // For now, just return the token (in production, send via email)
  res.status(200).json({
    success: true,
    message: 'Password reset email sent',
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

// @desc    Verify email
// @route   POST /api/auth/verify-email/:verificationToken
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { verificationToken } = req.params;

  const user = await User.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  // Verify email
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  // Update last active
  await req.user.updateLastActive();

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, role, search } = req.query;

  const query = { isActive: true };
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .populate('organization')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    }
  });
});

// @desc    Verify user (Admin only)
// @route   PUT /api/auth/users/:id/verify
// @access  Private/Admin
const verifyUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isVerified = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User verified successfully',
    data: user
  });
});

// @desc    Deactivate user (Admin only)
// @route   PUT /api/auth/users/:id/deactivate
// @access  Private/Admin
const deactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
    data: user
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateAvatar,
  deleteAvatar,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
  getAllUsers,
  verifyUser,
  deactivateUser
}; 