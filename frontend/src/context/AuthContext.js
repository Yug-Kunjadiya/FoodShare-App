import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
          
          // Set token in API headers
          authAPI.setAuthToken(token);
          
          // Get current user
          const response = await authAPI.getMe();
          
          if (response.success) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data });
            dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
          } else {
            throw new Error('Failed to get user data');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        const { token, user } = response;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set token in API headers
        authAPI.setAuthToken(token);
        
        // Update state
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        
        toast.success('Login successful!');
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        const { token, user } = response;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set token in API headers
        authAPI.setAuthToken(token);
        
        // Update state
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        
        toast.success('Registration successful! Welcome to FoodShare!');
        return { success: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API if user is authenticated
      if (state.token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Clear token from API headers
      authAPI.clearAuthToken();
      
      // Clear React Query cache
      queryClient.clear();
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data });
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user avatar
  const updateAvatar = async (avatarFile) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authAPI.updateAvatar(avatarFile);
      
      if (response.success) {
        // Update user with new avatar
        dispatch({ 
          type: AUTH_ACTIONS.SET_USER, 
          payload: { ...state.user, avatar: response.data.avatar }
        });
        toast.success('Avatar updated successfully!');
        return { success: true };
      } else {
        throw new Error(response.message || 'Avatar update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Avatar update failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update password
  const updatePassword = async (passwordData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authAPI.updatePassword(passwordData);
      
      if (response.success) {
        toast.success('Password updated successfully!');
        return { success: true };
      } else {
        throw new Error(response.message || 'Password update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Password update failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user && state.user.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Check if user is donor
  const isDonor = () => {
    return hasRole('donor');
  };

  // Check if user is receiver
  const isReceiver = () => {
    return hasRole('receiver');
  };

  // Check if user can access resource (owner or admin)
  const canAccess = (resourceUserId) => {
    return state.user && (
      state.user._id === resourceUserId || 
      state.user.role === 'admin'
    );
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    updateAvatar,
    updatePassword,
    clearError,
    
    // Utility functions
    hasRole,
    isAdmin,
    isDonor,
    isReceiver,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export action types for external use
export { AUTH_ACTIONS }; 