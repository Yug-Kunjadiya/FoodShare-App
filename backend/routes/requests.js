const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateRequestCreation, validateId } = require('../middleware/validation');
const ctrl = require('../controllers/requestController');

router.use(protect);

// Receiver creates a request for a food item
router.post('/', authorize('receiver', 'admin'), validateRequestCreation, ctrl.createRequest);

// Get my requests (donor sees incoming, receiver sees outgoing)
router.get('/', ctrl.getMyRequests);

// Get single request (owner only)
router.get('/:id', validateId, ctrl.getRequestById);

// Update status (accept/reject/cancel/complete)
router.put('/:id/status', validateId, ctrl.updateStatus);

module.exports = router; 