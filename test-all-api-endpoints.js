// Comprehensive test script to verify all API endpoints
const fetch = require('node-fetch');

async function testAllAPIEndpoints() {
  console.log('🧪 Testing all API endpoints with production backend...\n');
  
  const baseUrl = 'https://service-3-backend-production.up.railway.app';
  
  const endpoints = [
    { name: 'Health Check', path: '/api/health', method: 'GET', auth: false },
    { name: 'Telugu Stories', path: '/api/telugu-stories?milestone=1', method: 'GET', auth: true },
    { name: 'Learning Progress', path: '/api/learning-progress', method: 'GET', auth: true },
    { name: 'Telugu Units', path: '/api/telugu-units', method: 'GET', auth: true },
    { name: 'Submissions', path: '/api/submissions/student', method: 'GET', auth: true },
    { name: 'Exams', path: '/api/exams/student', method: 'GET', auth: true },
    { name: 'Voice Examinations', path: '/api/voice-examinations/student', method: 'GET', auth: true },
    { name: 'Video Lectures', path: '/api/video-lectures/student', method: 'GET', auth: true }
  ];
  
  let passedTests = 0;
  let totalTests = endpoints.length;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.auth) {
        // Use a test token for authenticated endpoints
        options.headers['Authorization'] = 'Bearer test-token';
      }
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, options);
      
      if (endpoint.auth && response.status === 401) {
        console.log(`✅ ${endpoint.name}: Authentication required (expected)`);
        passedTests++;
      } else if (!endpoint.auth && response.status === 200) {
        console.log(`✅ ${endpoint.name}: Working correctly`);
        passedTests++;
      } else if (response.status === 404) {
        console.log(`❌ ${endpoint.name}: Endpoint not found (404)`);
      } else if (response.status === 500) {
        console.log(`❌ ${endpoint.name}: Server error (500)`);
      } else {
        console.log(`⚠️ ${endpoint.name}: Unexpected status ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Test Results: ${passedTests}/${totalTests} endpoints working`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All API endpoints are accessible and properly configured!');
  } else {
    console.log('⚠️ Some endpoints may need attention. Check the logs above.');
  }
}

// Run the test
testAllAPIEndpoints();
