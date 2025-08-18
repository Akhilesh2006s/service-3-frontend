# OTP Service Setup Guide

## Overview
This guide explains how to set up and run the OTP (One-Time Password) service for the Telugu Bhasha Gyan application.

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Setup Instructions

### 1. Configure Environment Variables

#### Backend (.env file in server folder)
- The backend uses Twilio for SMS OTP services
- In development mode, OTPs are logged to the console instead of being sent via SMS
- Make sure the following variables are set in `server/.env`:
  ```
  # Server Configuration
  PORT=3001
  FRONTEND_URL=http://localhost:8080
  ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081
  
  # Twilio Configuration (for SMS OTP)
  TWILIO_ACCOUNT_SID=your_twilio_sid
  TWILIO_AUTH_TOKEN=your_twilio_token
  TWILIO_PHONE_NUMBER=your_twilio_phone
  
  # Environment Configuration
  # Set to 'development' to see OTPs in console without sending SMS
  # Set to 'production' to send actual SMS via Twilio
  NODE_ENV=development
  ```

#### Frontend (.env file in root folder)
- The frontend needs to know the API URL
- Make sure the following variables are set in `.env` in the project root:
  ```
  VITE_API_URL=https://service-3-backend-production.up.railway.app/api
  VITE_MODE=development
  VITE_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081
  ```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 3. Troubleshooting Twilio SMS Issues

#### Verify Twilio Credentials
If SMS messages are not being sent, verify your Twilio credentials:

```bash
# Run this test script in the server directory
node -e "const twilio = require('twilio'); require('dotenv').config(); const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); client.messages.list().then(messages => console.log('Twilio connection successful. Recent messages:', messages.length)).catch(err => console.error('Twilio error:', err.message));"
```

#### Test SMS Sending
To test if your Twilio account can send SMS messages:

```bash
# Replace +1234567890 with the target phone number
node -e "const twilio = require('twilio'); require('dotenv').config(); const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); client.messages.create({body: 'Test message', from: process.env.TWILIO_PHONE_NUMBER, to: '+1234567890'}).then(message => console.log('Message sent successfully:', message.sid)).catch(err => console.error('Failed to send message:', err.message));"
```

#### Common Issues
- **Trial Account Limitations**: Twilio trial accounts can only send SMS to verified phone numbers. You must verify each recipient phone number in your Twilio console before sending SMS to it.
- **Phone Number Verification**: To verify a phone number in Twilio:
  1. Log in to your Twilio account
  2. Navigate to "Phone Numbers" > "Verified Caller IDs"
  3. Click "Add a new Caller ID"
  4. Enter the phone number you want to verify
  5. Follow the verification process (via call or SMS)
- **NODE_ENV Setting**: Make sure NODE_ENV is set to 'production' to enable actual SMS sending
- **Phone Number Format**: Ensure phone numbers are in E.164 format (e.g., +919876543210)

### 4. Start the Application

You can use the provided batch file to start both servers:

```bash
# On Windows
start-dev.bat
```

Or start them manually:

```bash
# Start backend server
cd server
npm run dev

# In another terminal, start frontend
npm run dev
```

## Testing OTP Functionality

1. Open the application at http://localhost:8080
2. Navigate to the login page
3. Enter a phone number and request an OTP
4. In development mode, the OTP will be logged in the backend console
5. Enter the OTP from the console to verify

## Troubleshooting

### OTP Not Being Sent
- Check that the backend server is running
- Verify that the NODE_ENV is set to "development" in server/.env
- Look for OTP logs in the backend console

### API Connection Issues
- Ensure CORS is properly configured in the backend
- Verify that the VITE_API_URL is correctly set in the frontend .env file
- Check browser console for any network errors