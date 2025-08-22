import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import FoodListings from './pages/food/FoodListings';
import FoodDetail from './pages/food/FoodDetail';
import AddFood from './pages/food/AddFood';
import EditFood from './pages/food/EditFood';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Requests from './pages/Requests';
import MapView from './pages/MapView';
import NotFound from './pages/NotFound';

// Styles
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/food" element={<FoodListings />} />
                  <Route path="/food/:id" element={<FoodDetail />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/food/add" element={
                    <ProtectedRoute requiredRole="donor">
                      <AddFood />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/food/edit/:id" element={
                    <ProtectedRoute requiredRole="donor">
                      <EditFood />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/requests" element={
                    <ProtectedRoute>
                      <Requests />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/map" element={
                    <ProtectedRoute>
                      <MapView />
                    </ProtectedRoute>
                  } />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              <Footer />
            </div>
          </Router>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 