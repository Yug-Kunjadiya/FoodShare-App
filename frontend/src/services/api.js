import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Set auth token for requests
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  // Clear auth token
  clearAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
  },

  // Login
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  // Register
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Get current user
  getMe: () => {
    return api.get('/auth/me');
  },

  // Update profile
  updateProfile: (profileData) => {
    return api.put('/auth/profile', profileData);
  },

  // Update avatar
  updateAvatar: (avatarFile) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    return api.put('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update password
  updatePassword: (passwordData) => {
    return api.put('/auth/password', passwordData);
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Forgot password
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (resetToken, password) => {
    return api.post(`/auth/reset-password/${resetToken}`, { password });
  },

  // Verify email
  verifyEmail: (verificationToken) => {
    return api.post(`/auth/verify-email/${verificationToken}`);
  },
};

// Food API
export const foodAPI = {
  // Get all food items
  getAll: (params) => {
    return api.get('/food', { params });
  },

  // Get food by ID
  getById: (id) => {
    return api.get(`/food/${id}`);
  },

  // Create new food item
  create: (foodData) => {
    return api.post('/food', foodData);
  },

  // Update food item
  update: (id, foodData) => {
    return api.put(`/food/${id}`, foodData);
  },

  // Delete food item
  delete: (id) => {
    return api.delete(`/food/${id}`);
  },

  // Search food
  search: (query, filters) => {
    return api.get('/food/search', { params: { q: query, ...filters } });
  },

  // Get nearby food
  getNearby: (coordinates, maxDistance) => {
    return api.get('/food/nearby', { 
      params: { 
        lat: coordinates[1], 
        lng: coordinates[0], 
        maxDistance 
      } 
    });
  },
};

// Request API
export const requestAPI = {
  // Get user requests
  getUserRequests: (role, filters) => {
    return api.get('/requests', { params: { role, ...filters } });
  },

  // Create request
  create: (requestData) => {
    return api.post('/requests', requestData);
  },

  // Update request status
  updateStatus: (id, status, message) => {
    return api.put(`/requests/${id}/status`, { status, message });
  },

  // Get request by ID
  getById: (id) => {
    return api.get(`/requests/${id}`);
  },
};

// Chat API
export const chatAPI = {
  // Get user chats
  getUserChats: () => {
    return api.get('/chat');
  },

  // Get chat messages
  getMessages: (chatId) => {
    return api.get(`/chat/${chatId}/messages`);
  },

  // Send message
  sendMessage: (chatId, messageData) => {
    return api.post(`/chat/${chatId}/messages`, messageData);
  },

  // Mark messages as read
  markAsRead: (chatId) => {
    return api.put(`/chat/${chatId}/read`);
  },
};

// User API
export const userAPI = {
  // Get user by ID
  getById: (id) => {
    return api.get(`/users/${id}`);
  },

  // Update user
  update: (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },

  // Get user rating
  getRating: (id) => {
    return api.get(`/users/${id}/rating`);
  },

  // Add rating
  addRating: (id, ratingData) => {
    return api.post(`/users/${id}/rating`, ratingData);
  },
};

export default api; 