const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['donor', 'receiver', 'admin'],
    default: 'receiver'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: ''
  },
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
    }
  },
  organization: {
    name: String,
    type: {
      type: String,
      enum: ['restaurant', 'hostel', 'household', 'ngo', 'charity', 'individual', 'other']
    },
    description: String,
    website: String
  },
  preferences: {
    foodTypes: [{
      type: String,
      enum: ['vegetarian', 'non-vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'other']
    }],
    maxDistance: {
      type: Number,
      default: 10, // in kilometers
      min: [1, 'Distance must be at least 1km'],
      max: [100, 'Distance cannot exceed 100km']
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  const addr = this.location.address;
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.zipCode, addr.country]
    .filter(Boolean)
    .join(', ');
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to add review
userSchema.methods.addReview = function(reviewerId, rating, comment) {
  this.rating.reviews.push({ reviewer: reviewerId, rating, comment });
  
  // Recalculate average rating
  const totalRating = this.rating.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.rating.reviews.length;
  this.rating.count = this.rating.reviews.length;
  
  return this.save();
};

// Static method to find users by location
userSchema.statics.findNearby = function(coordinates, maxDistance = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    isActive: true
  });
};

module.exports = mongoose.model('User', userSchema); 