# 🔄 Clear Browser Cache to Fix Authentication Issues

## 🚨 **IMPORTANT: Follow these steps to fix the "Access denied. No token provided" error**

### **Step 1: Clear Browser Storage**
1. **Open Developer Tools** (F12 or right-click → Inspect)
2. **Go to Application/Storage tab**
3. **Clear all storage:**
   - Click "Clear storage" or "Clear site data"
   - Or manually delete:
     - `telugu-basics-token`
     - `telugu-basics-user`

### **Step 2: Alternative Method (Faster)**
1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Run these commands:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
4. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)

### **Step 3: Re-login**
1. **Go to the login page**
2. **Login with your credentials**
3. **Check that you're redirected to the correct dashboard**

### **Step 4: Test the Fix**
1. **Try adding an evaluator or student**
2. **The error should be gone**
3. **Each trainer should now see only their own data**

## 🔧 **Why This Happens**
- Old tokens from previous sessions can cause conflicts
- The authentication system expects fresh JWT tokens
- Clearing cache ensures clean authentication state

## ✅ **Expected Result**
- No more "Access denied" errors
- Each trainer sees only their own evaluators/students
- Proper authentication for all API calls 