# 🗄️ MongoDB Atlas Setup Guide

## Current Status: ❌ NOT Connected to MongoDB
Your project is currently using **in-memory storage** with file backup (`users.json`).

## 🔧 To Connect to MongoDB Atlas:

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster (free tier)

### Step 2: Get Your Connection String
1. In Atlas dashboard, click "Connect"
2. Choose "Connect your application"
3. Copy the connection string

### Step 3: Update Your .env File
Replace the placeholder in `server/.env`:

```env
# REPLACE THIS:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telugu-learning?retryWrites=true&w=majority

# WITH YOUR ACTUAL CREDENTIALS:
MONGODB_URI=mongodb+srv://your_actual_username:your_actual_password@your_cluster_name.mongodb.net/telugu-learning?retryWrites=true&w=majority
```

### Step 4: Restart Server
```bash
cd server
node server.js
```

## ✅ What Will Happen After MongoDB Connection:

1. **Database Tables Created Automatically:**
   - `users` collection
   - `submissions` collection  
   - `learningactivities` collection
   - `exams` collection

2. **Existing Users Migrated:**
   - Current users from `users.json` will be moved to MongoDB
   - All data will persist across server restarts

3. **Real Database Features:**
   - Data persistence
   - Scalability
   - Backup and recovery
   - Real-time synchronization

## 🚨 Current Working Status:
- ✅ Backend API working
- ✅ User authentication working  
- ✅ All features functional
- ✅ Data stored locally in `users.json`
- ❌ MongoDB not connected (using local storage)

## 📊 Your Current Users (stored locally):
- Trainer: amenityforge@gmail.com
- Evaluator: akhileshsamayamanthula@gmail.com  
- Learner: amenityforge1@gmail.com
- Password: password123

**The system is fully functional with local storage, but for production you should connect to MongoDB Atlas.** 