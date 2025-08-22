const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donor is required']
  },
  title: {
    type: String,
    required: [true, 'Food title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  foodType: {
    type: String,
    required: [true, 'Food type is required'],
    enum: ['vegetarian', 'non-vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'other']
  },
  category: {
    type: String,
    required: [true, 'Food category is required'],
    enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'beverages', 'other']
  },
  quantity: {
    amount: {
      type: Number,
      required: [true, 'Quantity amount is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: ['servings', 'pieces', 'kg', 'grams', 'liters', 'packets', 'other']
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    caption: String
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && 
                 v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates format'
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    pickupInstructions: String
  },
  availability: {
    pickupTime: {
      start: {
        type: Date,
        required: [true, 'Pickup start time is required']
      },
      end: {
        type: Date,
        required: [true, 'Pickup end time is required']
      }
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required']
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  dietaryInfo: {
    allergens: [{
      type: String,
      enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'none']
    }],
    ingredients: [String],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }
  },
  packaging: {
    type: {
      type: String,
      enum: ['reusable', 'biodegradable', 'plastic', 'paper', 'other']
    },
    description: String
  },
  status: {
    type: String,
    enum: ['available', 'requested', 'claimed', 'expired', 'cancelled'],
    default: 'available'
  },
  requests: [{
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    },
    message: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date
  }],
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
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

// Create geospatial index for location-based queries
foodSchema.index({ 'location.coordinates': '2dsphere' });

// Create text index for search functionality
foodSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for pickup address
foodSchema.virtual('pickupAddress').get(function() {
  const addr = this.location.address;
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.zipCode, addr.country]
    .filter(Boolean)
    .join(', ');
});

// Virtual for time remaining
foodSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const end = this.availability.pickupTime.end;
  const diff = end - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
});

// Virtual for expiry status
foodSchema.virtual('isExpired').get(function() {
  return new Date() > this.availability.expiryTime;
});

// Virtual for pickup status
foodSchema.virtual('pickupStatus').get(function() {
  const now = new Date();
  const start = this.availability.pickupTime.start;
  const end = this.availability.pickupTime.end;
  
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'available';
  return 'expired';
});

// Method to increment views
foodSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to add request
foodSchema.methods.addRequest = function(receiverId, message) {
  this.requests.push({
    receiver: receiverId,
    message: message
  });
  this.status = 'requested';
  return this.save();
};

// Method to update request status
foodSchema.methods.updateRequestStatus = function(receiverId, status) {
  const request = this.requests.find(req => 
    req.receiver.toString() === receiverId.toString()
  );
  
  if (request) {
    request.status = status;
    request.respondedAt = new Date();
    
    if (status === 'accepted') {
      this.status = 'claimed';
      this.availability.isAvailable = false;
    }
  }
  
  return this.save();
};

// Static method to find available food by location
foodSchema.statics.findAvailableNearby = function(coordinates, maxDistance = 10, filters = {}) {
  const query = {
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    status: 'available',
    'availability.isAvailable': true,
    'availability.pickupTime.end': { $gt: new Date() },
    isActive: true
  };
  
  // Apply additional filters
  if (filters.foodType) query.foodType = filters.foodType;
  if (filters.category) query.category = filters.category;
  if (filters.donorId) query.donor = filters.donorId;
  
  return this.find(query)
    .populate('donor', 'name avatar organization.name rating.average')
    .sort({ createdAt: -1 });
};

// Static method to find food by search term
foodSchema.statics.searchFood = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'available',
    'availability.isAvailable': true,
    'availability.pickupTime.end': { $gt: new Date() },
    isActive: true
  };
  
  // Apply additional filters
  if (filters.foodType) query.foodType = filters.foodType;
  if (filters.category) query.category = filters.category;
  if (filters.location) {
    query['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: filters.location
        },
        $maxDistance: (filters.maxDistance || 10) * 1000
      }
    };
  }
  
  return this.find(query)
    .populate('donor', 'name avatar organization.name rating.average')
    .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Food', foodSchema); 