#!/usr/bin/env node

/**
 * Simple Authentication Test
 * Tests basic user registration and login functionality
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function for API requests
async function apiRequest(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`${method} ${endpoint}:`, response.status, result);
    
    if (!response.ok) {
      throw new Error(`API Error: ${result.error || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

async function testAuth() {
  console.log('🔍 Testing Authentication System...');
  
  try {
    // Test 1: Register a new user
    console.log('\n📝 Test 1: User Registration');
    const testEmail = `test.auth.${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    const registration = await apiRequest('POST', '/users/register', {
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
      phone: '+1-555-0000'
    });
    
    console.log('✅ Registration successful');
    console.log('   User ID:', registration.user.id);
    console.log('   Email:', registration.user.email);
    console.log('   Token received:', !!registration.token);
    
    // Test 2: Login with the registered user
    console.log('\n🔐 Test 2: User Login');
    
    const login = await apiRequest('POST', '/users/login', {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login successful');
    console.log('   User ID:', login.user.id);
    console.log('   Token received:', !!login.token);
    
    // Test 3: Test protected endpoint
    console.log('\n🛡️ Test 3: Protected Endpoint');
    
    const profileResponse = await fetch(`${API_BASE}/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${login.token}`
      }
    });
    
    const profile = await profileResponse.json();
    console.log('Protected endpoint response:', profileResponse.status, profile);
    
    if (profileResponse.ok) {
      console.log('✅ Protected endpoint access successful');
    } else {
      console.log('❌ Protected endpoint access failed');
    }
    
    console.log('\n🎉 Authentication tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:', error.message);
    throw error;
  }
}

// Run the test
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
  process.exit(1);
}

testAuth().catch(console.error);
