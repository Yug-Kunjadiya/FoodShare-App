const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');

const setupSocketIO = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`);

    // Join user to their personal room
    socket.join(socket.userId.toString());

    // Handle joining chat rooms
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`💬 User ${socket.user.name} joined chat: ${chatId}`);
    });

    // Handle leaving chat rooms
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      console.log(`👋 User ${socket.user.name} left chat: ${chatId}`);
    });

    // Handle new messages
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, receiverId } = data;

        // Create or find existing chat
        let chat = await Chat.findById(chatId);
        
        if (!chat) {
          // Create new chat if it doesn't exist
          chat = new Chat({
            participants: [socket.userId, receiverId],
            messages: []
          });
          await chat.save();
        }

        // Add message to chat
        const message = {
          sender: socket.userId,
          content,
          timestamp: new Date()
        };

        chat.messages.push(message);
        await chat.save();

        // Emit message to all participants in the chat
        io.to(chatId).emit('new-message', {
          chatId,
          message: {
            ...message,
            sender: {
              _id: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar
            }
          }
        });

        // Emit notification to receiver if they're not in the chat room
        socket.to(receiverId.toString()).emit('message-notification', {
          chatId,
          sender: socket.user.name,
          preview: content.substring(0, 50)
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (chatId) => {
      socket.to(chatId).emit('user-typing', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('typing-stop', (chatId) => {
      socket.to(chatId).emit('user-stop-typing', {
        chatId,
        userId: socket.userId
      });
    });

    // Handle online status
    socket.on('set-online', () => {
      socket.broadcast.emit('user-online', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.name} (${socket.userId})`);
      
      // Emit offline status
      socket.broadcast.emit('user-offline', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });
  });

  console.log('🔌 Socket.IO setup completed');
};

module.exports = { setupSocketIO }; 