const Request = require('../models/Request');
const Food = require('../models/Food');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Create a new claim request (receiver)
const createRequest = asyncHandler(async (req, res, next) => {
  const receiverId = req.user._id;
  const { foodItem, message, requestedQuantity, pickupDetails } = req.body;

  const food = await Food.findById(foodItem);
  if (!food || !food.isActive || food.status !== 'available') {
    return next(new AppError('Food item not available', 400));
  }

  const request = await Request.create({
    foodItem,
    donor: food.donor,
    receiver: receiverId,
    message,
    requestedQuantity,
    pickupDetails
  });

  // Mark food as requested
  food.status = 'requested';
  await food.save();

  res.status(201).json({ success: true, data: request });
});

// Get requests for current user (role auto-detected)
const getMyRequests = asyncHandler(async (req, res) => {
  const role = req.user.role === 'donor' ? 'donor' : 'receiver';
  const query = role === 'donor' ? { donor: req.user._id } : { receiver: req.user._id };
  const requests = await Request.find(query)
    .populate('foodItem', 'title images location.address availability status')
    .populate('donor', 'name avatar phone')
    .populate('receiver', 'name avatar phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
});

// Update request status (donor can accept/reject)
const updateStatus = asyncHandler(async (req, res, next) => {
  const { status, message } = req.body; // accepted | rejected | cancelled | completed
  const request = await Request.findById(req.params.id);
  if (!request) return next(new AppError('Request not found', 404));

  const isDonor = request.donor.toString() === req.user._id.toString();
  const isReceiver = request.receiver.toString() === req.user._id.toString();

  if (status === 'accepted') {
    if (!isDonor) return next(new AppError('Only donor can accept', 403));
    await request.accept(message);
  } else if (status === 'rejected') {
    if (!isDonor) return next(new AppError('Only donor can reject', 403));
    await request.reject(message);
  } else if (status === 'cancelled') {
    if (!isReceiver && !isDonor) return next(new AppError('Not authorized to cancel', 403));
    await request.cancel(message, isDonor ? 'donor' : 'receiver');
  } else if (status === 'completed') {
    if (!isDonor) return next(new AppError('Only donor can complete', 403));
    await request.markPickedUp();
  } else {
    return next(new AppError('Invalid status', 400));
  }

  // Update food status when accepted/completed/cancelled
  const food = await Food.findById(request.foodItem);
  if (status === 'accepted') {
    food.status = 'claimed';
    food.availability.isAvailable = false;
    await food.save();
  } else if (status === 'cancelled' || status === 'rejected') {
    // revert to available if there are no other pending/accepted requests
    const active = await Request.find({ foodItem: food._id, status: { $in: ['pending', 'accepted'] } }).countDocuments();
    if (active === 0) {
      food.status = 'available';
      food.availability.isAvailable = true;
      await food.save();
    }
  }

  res.json({ success: true, data: request });
});

// Get single request
const getRequestById = asyncHandler(async (req, res, next) => {
  const r = await Request.findById(req.params.id)
    .populate('foodItem', 'title images location.address availability status')
    .populate('donor', 'name avatar phone')
    .populate('receiver', 'name avatar phone');
  if (!r) return next(new AppError('Request not found', 404));
  const isOwner = r.donor.toString() === req.user._id.toString() || r.receiver.toString() === req.user._id.toString() || req.user.role === 'admin';
  if (!isOwner) return next(new AppError('Not authorized', 403));
  res.json({ success: true, data: r });
});

module.exports = { createRequest, getMyRequests, updateStatus, getRequestById };
