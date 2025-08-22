#!/bin/bash

echo "🍲 FoodShare App - Installation Script"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed"
echo ""

# Return to root directory
cd ..

echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy backend/env.example to backend/.env and configure your environment variables"
echo "2. Copy frontend/env.example to frontend/.env and configure your environment variables"
echo "3. Start the backend: cd backend && npm run dev"
echo "4. Start the frontend: cd frontend && npm start"
echo ""
echo "🔑 Required environment variables:"
echo "   - MongoDB connection string"
echo "   - JWT secret"
echo "   - Cloudinary credentials"
echo "   - Google Maps API key"
echo ""
echo "📚 For more information, see the README.md file"
echo "" 