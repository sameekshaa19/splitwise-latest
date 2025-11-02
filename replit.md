# Splitwise Clone - React Native/Expo Application

## Overview
A full-stack expense splitting application built with React Native (Expo) for the frontend and Express/MongoDB for the backend. The app allows users to create groups, add expenses, and track who owes whom.

## Project Structure

### Frontend (`/`)
- **Framework**: React Native with Expo
- **Router**: Expo Router (file-based routing)
- **UI**: React Native components with Lucide icons
- **Storage**: LocalStorage (web) / AsyncStorage (mobile)
- **Port**: 5000 (web)

### Backend (`/backend`)
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Port**: 3000 (localhost only)
- **Authentication**: JWT-based (planned)

## Key Features
1. **Groups Management**: Create and manage expense groups
2. **Expense Tracking**: Add expenses and split them among group members
3. **Balance Calculation**: Track who owes whom
4. **Dietary Preferences**: Track member dietary preferences
5. **Offline Support**: LocalStorage persistence for web

## Recent Changes (Nov 2, 2025)

### Database Configuration
- ✅ Updated `database.ts` to use LocalStorage for web (instead of AsyncStorage)
- ✅ Fixed SSR issues with AsyncStorage by checking for `window` object
- ✅ Added proper initialization checks for client-side only

### Groups Screen
- ✅ Connected to GroupService instead of using mock data
- ✅ Groups now persist to local storage
- ✅ Added loading states for create group functionality
- ✅ Groups load on component mount from persisted storage

### Known Issues

#### Backend
- ⚠️ **MongoDB Connection Failing**: The MongoDB Atlas database requires IP whitelisting. The Replit server IP needs to be added to the MongoDB Atlas whitelist for the backend to connect properly.
- 📝 **Temporary Solution**: Frontend uses local storage (LocalStorage/AsyncStorage) for data persistence until MongoDB connection is fixed.

#### To Fix MongoDB Connection:
1. Log into MongoDB Atlas
2. Go to Network Access
3. Add Replit's IP address to the IP whitelist
4. Or allow access from anywhere (0.0.0.0/0) for development

## Environment Variables

### Frontend (`.env`)
```
EXPO_PUBLIC_MONGODB_URI=<MongoDB connection string>
EXPO_PUBLIC_REPLIT_DOMAIN=<Replit domain>
```

### Backend (`backend/.env`)
```
MONGODB_URI=<MongoDB connection string>
JWT_SECRET=<JWT secret key>
JWT_EXPIRE=30d
PORT=3000
NODE_ENV=development
```

## Running the Application

### Frontend
```bash
npm run web
```
The app will be available on port 5000

### Backend
```bash
cd backend
npm start
```
The API will be available on localhost:3000

## Current Status
- ✅ Frontend is functional with local storage
- ✅ Groups can be created and persisted
- ✅ UI is responsive for both web and mobile
- ⚠️ Backend MongoDB connection needs IP whitelisting
- 🔄 Full backend API integration pending MongoDB fix

## Next Steps
1. Fix MongoDB Atlas IP whitelisting issue
2. Implement expense creation functionality
3. Add member management to groups
4. Implement balance calculations
5. Add user authentication

## Development Notes
- The app uses Expo Router with file-based routing from the `src` directory
- Database operations work offline using LocalStorage on web
- Mobile display uses React Native modal components optimized for small screens
