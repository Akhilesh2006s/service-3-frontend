// Test script to verify server is working
const fetch = require('node-fetch');

async function testServer() {
  const baseUrl = 'https://service-3-backend-production.up.railway.app';
  
  console.log('Testing server endpoints...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);
    
    // Test SMS OTP endpoint
    console.log('\n2. Testing SMS OTP endpoint...');
    const otpResponse = await fetch(`${baseUrl}/api/send-sms-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:8082'
      },
      body: JSON.stringify({ phone: '+919876543210' })
    });
    
    if (otpResponse.ok) {
      const otpData = await otpResponse.json();
      console.log('SMS OTP response:', otpData);
    } else {
      console.log('SMS OTP failed:', otpResponse.status, otpResponse.statusText);
      const errorText = await otpResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testServer(); 