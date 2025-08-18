# 🔧 Fix Exam Issues - Complete Guide

## 🚨 **Current Problems:**
1. **403 Forbidden Error** when fetching submissions
2. **Mock exam data** showing instead of real exams
3. **Exam submission not working** properly
4. **Progress showing 0/2** instead of actual completion
5. **Exam completed with 0%** but not actually working

## ✅ **Step-by-Step Fixes:**

### **Step 1: Check Authentication Status**
1. **Open the Learner Dashboard**
2. **Click the "🔍 Check Auth" button** in the header
3. **Check the browser console** for authentication info
4. **Look for:**
   - User role should be "learner"
   - Token should be present
   - No authentication errors

### **Step 2: Fix User Role (If Wrong)**
1. **Click the "🔑 Restore Auth" button** (yellow button)
2. **This will set:**
   - Role: learner
   - Token: test-token-1-learner
   - User ID: 1
3. **Page will reload automatically**

### **Step 3: Create Real Exam Data**
1. **Start MongoDB** (if not running):
   ```bash
   # In a new terminal
   mongod
   ```

2. **Create a test exam**:
   ```bash
   cd server
   node create-test-exam.js
   ```

3. **This creates:**
   - A real trainer user
   - A real exam with 3 MCQ questions
   - Proper exam structure

### **Step 4: Test Exam Functionality**
1. **Refresh the Learner Dashboard**
2. **You should see:**
   - "Telugu Basics Test" exam
   - Status: Available (not completed)
   - Progress: 0/1 (not 0/2)

3. **Click "Attempt Test"**
4. **Answer the questions**
5. **Click "🎯 SUBMIT EXAM & GET MARKS"**
6. **Check results and submission**

### **Step 5: Verify Submissions**
1. **After completing exam:**
   - Check browser console for submission logs
   - Look for "Submission result" logs
   - Verify no 403 errors

2. **Dashboard should show:**
   - Exam marked as completed
   - Score displayed correctly
   - Progress updated

## 🔍 **Debug Information:**

### **Console Logs to Look For:**
```
LearnerDashboard - Current user: {role: "learner", ...}
LearnerDashboard - User role: learner
LearnerDashboard - Token: Present
LearnerDashboard - Fetching exams...
LearnerDashboard - Exams response status: 200
LearnerDashboard - Exams result: {success: true, data: [...]}
```

### **Error Messages to Fix:**
- `403 (Forbidden)` → Check user role
- `Access denied. Insufficient permissions` → Fix authentication
- `No token provided` → Restore authentication

## 🎯 **Expected Results After Fix:**
- ✅ No more 403 errors
- ✅ Real exam data (not mock)
- ✅ Exam submission works
- ✅ Progress updates correctly
- ✅ Scores are calculated and displayed
- ✅ Submissions are saved to database

## 🚀 **Quick Test:**
1. **Click "🔑 Restore Auth"**
2. **Wait for page reload**
3. **Check console for "learner" role**
4. **Try taking an exam**
5. **Submit and check results**

## 📞 **If Issues Persist:**
1. **Check MongoDB is running**
2. **Verify server is running on port 5000**
3. **Clear browser cache completely**
4. **Check network tab for API errors**
5. **Look for authentication middleware errors**

## 🔧 **Technical Details:**
- **Authentication**: JWT tokens with role-based access
- **Exam Storage**: MongoDB with proper schemas
- **Submission Flow**: POST to /api/submissions
- **Role Verification**: requireRole(['learner']) middleware
- **Score Calculation**: Correct answers / Total questions * 100






