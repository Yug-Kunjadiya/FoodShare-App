const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Chat = require('../models/Chat');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.use(protect);

// List my chats
router.get('/', asyncHandler(async (req, res) => {
  const chats = await Chat.findUserChats(req.user._id);
  res.json({ success: true, data: chats });
}));

// Get messages for a chat
router.get('/:id/messages', asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return next(new AppError('Chat not found', 404));
  if (!chat.isParticipant(req.user._id)) return next(new AppError('Not authorized', 403));
  res.json({ success: true, data: chat.messages });
}));

// Post message
router.post('/:id/messages', asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return next(new AppError('Chat not found', 404));
  if (!chat.isParticipant(req.user._id)) return next(new AppError('Not authorized', 403));

  await chat.addMessage(req.user._id, req.body.content, req.body.messageType, {
    mediaUrl: req.body.mediaUrl,
    mediaCaption: req.body.mediaCaption,
  });

  res.status(201).json({ success: true });
}));

// Mark read
router.put('/:id/read', asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return next(new AppError('Chat not found', 404));
  if (!chat.isParticipant(req.user._id)) return next(new AppError('Not authorized', 403));
  await chat.markAsRead(req.user._id);
  res.json({ success: true });
}));

module.exports = router; 