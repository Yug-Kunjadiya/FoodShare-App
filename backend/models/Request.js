const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: [true, 'Food item is required']
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donor is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  requestedQuantity: {
    amount: {
      type: Number,
      required: [true, 'Requested quantity amount is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      required: [true, 'Requested quantity unit is required'],
      enum: ['servings', 'pieces', 'kg', 'grams', 'liters', 'packets', 'other']
    }
  },
  pickupDetails: {
    preferredTime: {
      type: Date,
      required: [true, 'Preferred pickup time is required']
    },
    alternativeTime: Date,
    specialInstructions: String
  },
  donorResponse: {
    message: String,
    respondedAt: Date,
    proposedPickupTime: Date
  },
  receiverConfirmation: {
    confirmedPickupTime: Date,
    confirmedAt: Date,
    pickupInstructions: String
  },
  actualPickup: {
    pickedUpAt: Date,
    actualQuantity: {
      amount: Number,
      unit: String
    },
    notes: String
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['donor', 'receiver', 'system']
    },
    cancelledAt: Date
  },
  rating: {
    donorRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    },
    receiverRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient queries
requestSchema.index({ foodItem: 1, receiver: 1 });
requestSchema.index({ donor: 1, status: 1 });
requestSchema.index({ receiver: 1, status: 1 });
requestSchema.index({ createdAt: -1 });

// Virtual for request status display
requestSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for time until pickup
requestSchema.virtual('timeUntilPickup').get(function() {
  if (!this.pickupDetails?.preferredTime) return null;
  
  const now = new Date();
  const pickupTime = new Date(this.pickupDetails.preferredTime);
  const diff = pickupTime - now;
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
});

// Virtual for is overdue
requestSchema.virtual('isOverdue').get(function() {
  if (!this.pickupDetails?.preferredTime) return false;
  return new Date() > new Date(this.pickupDetails.preferredTime);
});

// Method to accept request
requestSchema.methods.accept = function(message, proposedPickupTime) {
  this.status = 'accepted';
  this.donorResponse = {
    message: message || 'Request accepted',
    respondedAt: new Date(),
    proposedPickupTime: proposedPickupTime || this.pickupDetails.preferredTime
  };
  
  return this.save();
};

// Method to reject request
requestSchema.methods.reject = function(message) {
  this.status = 'rejected';
  this.donorResponse = {
    message: message || 'Request rejected',
    respondedAt: new Date()
  };
  
  return this.save();
};

// Method to cancel request
requestSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellation = {
    reason: reason || 'Request cancelled',
    cancelledBy: cancelledBy || 'receiver',
    cancelledAt: new Date()
  };
  
  return this.save();
};

// Method to confirm pickup
requestSchema.methods.confirmPickup = function(confirmedPickupTime, pickupInstructions) {
  this.receiverConfirmation = {
    confirmedPickupTime: confirmedPickupTime || this.pickupDetails.preferredTime,
    confirmedAt: new Date(),
    pickupInstructions: pickupInstructions || ''
  };
  
  return this.save();
};

// Method to mark as picked up
requestSchema.methods.markPickedUp = function(actualQuantity, notes) {
  this.status = 'completed';
  this.actualPickup = {
    pickedUpAt: new Date(),
    actualQuantity: actualQuantity || this.requestedQuantity,
    notes: notes || ''
  };
  
  return this.save();
};

// Method to add rating
requestSchema.methods.addRating = function(raterType, rating, comment) {
  if (raterType === 'donor') {
    this.rating.donorRating = {
      rating,
      comment,
      ratedAt: new Date()
    };
  } else if (raterType === 'receiver') {
    this.rating.receiverRating = {
      rating,
      comment,
      ratedAt: new Date()
    };
  }
  
  return this.save();
};

// Static method to find requests by user
requestSchema.statics.findByUser = function(userId, role, options = {}) {
  const query = { isActive: true };
  
  if (role === 'donor') {
    query.donor = userId;
  } else if (role === 'receiver') {
    query.receiver = userId;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.foodItemId) {
    query.foodItem = options.foodItemId;
  }
  
  return this.find(query)
    .populate('foodItem', 'title images location.address')
    .populate('donor', 'name avatar organization.name')
    .populate('receiver', 'name avatar organization.name')
    .sort({ createdAt: -1 });
};

// Static method to find pending requests for donor
requestSchema.statics.findPendingForDonor = function(donorId) {
  return this.find({
    donor: donorId,
    status: 'pending',
    isActive: true
  })
    .populate('foodItem', 'title images location.address')
    .populate('receiver', 'name avatar organization.name phone')
    .sort({ createdAt: -1 });
};

// Static method to find active requests for food item
requestSchema.statics.findActiveForFood = function(foodItemId) {
  return this.find({
    foodItem: foodItemId,
    status: { $in: ['pending', 'accepted'] },
    isActive: true
  })
    .populate('receiver', 'name avatar organization.name phone')
    .sort({ createdAt: -1 });
};

// Pre-save middleware to validate quantity
requestSchema.pre('save', function(next) {
  // Ensure requested quantity doesn't exceed available quantity
  if (this.isModified('requestedQuantity') && this.foodItem) {
    // This validation would need to be done in the controller
    // since we need to fetch the food item to compare quantities
  }
  
  next();
});

module.exports = mongoose.model('Request', requestSchema); 