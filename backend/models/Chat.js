const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location', 'file'],
    default: 'text'
  },
  mediaUrl: String,
  mediaCaption: String,
  location: {
    coordinates: [Number],
    address: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'At least two participants are required']
  }],
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: [true, 'Food item reference is required']
  },
  messages: [messageSchema],
  lastMessage: {
    type: messageSchema,
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound index for efficient queries
chatSchema.index({ participants: 1, foodItem: 1 });
chatSchema.index({ 'lastActivity': -1 });

// Virtual for chat title (for display purposes)
chatSchema.virtual('chatTitle').get(function() {
  if (this.participants.length === 2) {
    return `Chat about ${this.foodItem ? this.foodItem.title : 'food item'}`;
  }
  return `Group chat with ${this.participants.length} participants`;
});

// Virtual for other participant (useful for 1-on-1 chats)
chatSchema.virtual('otherParticipant').get(function() {
  // This would need to be populated with the current user's ID to work properly
  return null;
});

// Method to add message to chat
chatSchema.methods.addMessage = function(senderId, content, messageType = 'text', mediaData = {}) {
  const message = {
    sender: senderId,
    content,
    messageType,
    ...mediaData
  };
  
  this.messages.push(message);
  this.lastMessage = message;
  this.lastActivity = new Date();
  
  // Update unread count for other participants
  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });
  
  return this.save();
};

// Method to mark messages as read for a specific user
chatSchema.methods.markAsRead = function(userId) {
  const now = new Date();
  
  // Mark all unread messages as read
  this.messages.forEach(message => {
    if (!message.isRead && message.sender.toString() !== userId.toString()) {
      message.isRead = true;
      message.readAt = now;
    }
  });
  
  // Reset unread count for this user
  this.unreadCount.set(userId.toString(), 0);
  
  return this.save();
};

// Method to get unread count for a specific user
chatSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(participant => 
    participant.toString() === userId.toString()
  );
};

// Static method to find or create chat between users for a specific food item
chatSchema.statics.findOrCreateChat = async function(participant1Id, participant2Id, foodItemId) {
  let chat = await this.findOne({
    participants: { $all: [participant1Id, participant2Id] },
    foodItem: foodItemId
  });
  
  if (!chat) {
    chat = new this({
      participants: [participant1Id, participant2Id],
      foodItem: foodItemId,
      messages: [],
      unreadCount: new Map()
    });
    await chat.save();
  }
  
  return chat;
};

// Static method to find chats for a user
chatSchema.statics.findUserChats = function(userId, options = {}) {
  const query = {
    participants: userId,
    isActive: true
  };
  
  if (options.foodItemId) {
    query.foodItem = options.foodItemId;
  }
  
  return this.find(query)
    .populate('participants', 'name avatar')
    .populate('foodItem', 'title images')
    .populate('lastMessage.sender', 'name avatar')
    .sort({ lastActivity: -1 });
};

// Static method to search chats by content
chatSchema.statics.searchChats = function(userId, searchTerm) {
  return this.find({
    participants: userId,
    isActive: true,
    'messages.content': { $regex: searchTerm, $options: 'i' }
  })
    .populate('participants', 'name avatar')
    .populate('foodItem', 'title images')
    .sort({ lastActivity: -1 });
};

// Pre-save middleware to ensure participants array has at least 2 users
chatSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    return next(new Error('Chat must have at least 2 participants'));
  }
  
  // Ensure participants are unique
  const uniqueParticipants = [...new Set(this.participants)];
  if (uniqueParticipants.length !== this.participants.length) {
    this.participants = uniqueParticipants;
  }
  
  next();
});

module.exports = mongoose.model('Chat', chatSchema); 