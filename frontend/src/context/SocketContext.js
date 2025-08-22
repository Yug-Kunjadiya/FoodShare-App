import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      // Create socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Socket event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, token, socket]);

  // Cleanup socket when user logs out
  useEffect(() => {
    if (!isAuthenticated && socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, socket]);

  // Socket utility functions
  const joinChat = (chatId) => {
    if (socket && isConnected) {
      socket.emit('join-chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket && isConnected) {
      socket.emit('leave-chat', chatId);
    }
  };

  const sendMessage = (chatId, content, receiverId) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        chatId,
        content,
        receiverId
      });
    }
  };

  const startTyping = (chatId) => {
    if (socket && isConnected) {
      socket.emit('typing-start', chatId);
    }
  };

  const stopTyping = (chatId) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', chatId);
    }
  };

  const setOnline = () => {
    if (socket && isConnected) {
      socket.emit('set-online');
    }
  };

  const value = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    setOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 