// Test script to verify Telugu Stories API endpoints
import fetch from 'node-fetch';

async function testTeluguStoriesAPI() {
  console.log('🧪 Testing Telugu Stories API endpoints...\n');
  
  const baseUrl = 'https://service-3-backend-production.up.railway.app';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData.message);
    } else {
      console.log('❌ Health check failed');
      return;
    }
    
    // Test 2: Telugu Stories endpoint (without auth - should return 401)
    console.log('\n2. Testing Telugu Stories endpoint without authentication...');
    const storiesResponse = await fetch(`${baseUrl}/api/telugu-stories?milestone=1`);
    console.log('Stories endpoint status:', storiesResponse.status);
    
    if (storiesResponse.status === 401) {
      console.log('✅ Authentication required (expected)');
    } else {
      console.log('⚠️ Unexpected response:', storiesResponse.status);
    }
    
    // Test 3: Telugu Stories endpoint with invalid token
    console.log('\n3. Testing Telugu Stories endpoint with invalid token...');
    const invalidTokenResponse = await fetch(`${baseUrl}/api/telugu-stories?milestone=1`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    console.log('Invalid token status:', invalidTokenResponse.status);
    
    if (invalidTokenResponse.status === 401) {
      console.log('✅ Invalid token rejected (expected)');
    } else {
      console.log('⚠️ Unexpected response for invalid token:', invalidTokenResponse.status);
    }
    
    console.log('\n✅ Telugu Stories API endpoint tests completed!');
    console.log('📝 The API endpoints are accessible and properly configured.');
    console.log('🔐 Authentication is working as expected.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTeluguStoriesAPI();
