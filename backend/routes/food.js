const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateFoodCreation, validateFoodUpdate, validateId } = require('../middleware/validation');
const ctrl = require('../controllers/foodController');

// Public
router.get('/', ctrl.getFoods);
router.get('/search', ctrl.searchFood);
router.get('/nearby', ctrl.nearbyFood);
router.get('/:id', validateId, ctrl.getFoodById);

// Protected donor routes
router.post('/', protect, authorize('donor', 'admin'), validateFoodCreation, ctrl.createFood);
router.put('/:id', protect, authorize('donor', 'admin'), validateId, validateFoodUpdate, ctrl.updateFood);
router.delete('/:id', protect, authorize('donor', 'admin'), validateId, ctrl.deleteFood);

module.exports = router; 