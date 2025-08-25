const Food = require('../models/Food');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Create new food listing (donor only)
const createFood = asyncHandler(async (req, res) => {
  const donorId = req.user._id;
  const payload = { ...req.body, donor: donorId };
  const food = await Food.create(payload);
  res.status(201).json({ success: true, data: food });
});

// Get all food (with basic filters)
const getFoods = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, foodType, category, donorId, sort = '-createdAt' } = req.query;
  const query = { isActive: true };
  if (foodType) query.foodType = foodType;
  if (category) query.category = category;
  if (donorId) query.donor = donorId;

  const foods = await Food.find(query)
    .populate('donor', 'name avatar organization.name rating.average')
    .sort(sort)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Food.countDocuments(query);

  res.json({ success: true, data: foods, pagination: { page: Number(page), limit: Number(limit), total } });
});

// Get single food by id
const getFoodById = asyncHandler(async (req, res, next) => {
  const food = await Food.findById(req.params.id).populate('donor', 'name avatar organization.name rating.average');
  if (!food) return next(new AppError('Food not found', 404));
  res.json({ success: true, data: food });
});

// Update food (owner or admin)
const updateFood = asyncHandler(async (req, res, next) => {
  let food = await Food.findById(req.params.id);
  if (!food) return next(new AppError('Food not found', 404));
  const isOwner = food.donor.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') return next(new AppError('Not authorized', 403));

  Object.assign(food, req.body);
  await food.save();
  res.json({ success: true, data: food });
});

// Delete food (soft deactivate)
const deleteFood = asyncHandler(async (req, res, next) => {
  let food = await Food.findById(req.params.id);
  if (!food) return next(new AppError('Food not found', 404));
  const isOwner = food.donor.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') return next(new AppError('Not authorized', 403));

  food.isActive = false;
  food.status = 'cancelled';
  await food.save();
  res.json({ success: true, message: 'Listing removed' });
});

// Search by text + optional filters
const searchFood = asyncHandler(async (req, res) => {
  const { q = '', foodType, category, lat, lng, maxDistance = 10 } = req.query;
  const filters = {};
  if (foodType) filters.foodType = foodType;
  if (category) filters.category = category;
  if (lat && lng) filters.location = [Number(lng), Number(lat)], filters.maxDistance = Number(maxDistance);

  const results = q
    ? await Food.searchFood(q, filters)
    : await Food.findAvailableNearby(filters.location || [0, 0], filters.maxDistance || 10, filters);

  res.json({ success: true, data: results });
});

// Nearby by coordinates
const nearbyFood = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 10, foodType, category, donorId } = req.query;
  if (lat === undefined || lng === undefined) return res.status(400).json({ success: false, message: 'lat and lng are required' });
  const results = await Food.findAvailableNearby([Number(lng), Number(lat)], Number(maxDistance), { foodType, category, donorId });
  res.json({ success: true, data: results });
});

module.exports = { createFood, getFoods, getFoodById, updateFood, deleteFood, searchFood, nearbyFood };
