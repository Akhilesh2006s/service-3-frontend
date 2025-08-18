// Simple script to test OTP functionality
import fetch from 'node-fetch';

async function testOTP() {
  try {
    console.log('Testing OTP functionality...');
    
    // Send OTP request
    const response = await fetch('https://service-3-backend-production.up.railway.app/api/send-sms-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: '+919390203316' })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.otp) {
      console.log('OTP received successfully:', data.otp);
    } else {
      console.log('No OTP in response');
    }
  } catch (error) {
    console.error('Error testing OTP:', error);
  }
}

testOTP();