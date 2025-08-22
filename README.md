# 🍲 FoodShare App


A MERN stack web application that connects food donors with receivers to reduce food waste and promote sustainability.

## 🎯 Project Overview

FoodShare App acts like "Uber for surplus food" where donors (restaurants, hostels, households) can list available food items, and receivers (NGOs, needy people, charities) can find and claim them.

## ✨ Core Features

- **👥 User Management**: Donor and Receiver roles with JWT authentication
- **🍛 Food Listings**: CRUD operations for food posts with images
- **🗺️ Map Integration**: Google Maps integration for location-based food discovery
- **💬 Real-Time Chat**: Socket.IO powered chat between donors and receivers
- **📩 Request System**: Request and approval workflow for food claims
- **🛠️ Admin Dashboard**: User and content management (optional)

## 🏗️ Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **Real-Time**: Socket.IO
- **Maps**: Google Maps API
- **File Upload**: Multer + Cloudinary
- **Deployment**: Vercel (frontend) + Render (backend) + MongoDB Atlas

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Google Maps API key
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foodshare-app
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend (.env)
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend (.env)
   cd ../frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm start
   ```

## 📁 Project Structure

```
foodshare-app/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # Express routes
│   ├── controllers/     # Route logic
│   ├── middleware/      # Auth & validation
│   ├── config/          # Database & external APIs
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # State management
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API calls
│   │   └── utils/       # Helper functions
│   └── public/          # Static assets
└── README.md
```

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

## 🚀 Deployment

### Backend (Render/Heroku)
1. Push code to GitHub
2. Connect repository to Render/Heroku
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy build folder to Vercel/Netlify
3. Set environment variables

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Get connection string
3. Update backend environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- MERN stack community
- Google Maps API
- Cloudinary for image hosting
- Socket.IO for real-time features 
=======
> **Connecting surplus food with those who need it most**

A MERN stack web application that acts as "Uber for surplus food", enabling donors to list available food items and receivers to find and claim them in real-time.
>>>>>>> bfb5f6fcc97d242c3eabcd1e06ac00ce5dd3e221
