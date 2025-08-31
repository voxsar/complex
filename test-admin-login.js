const axios = require('axios');

// Test admin login functionality
async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login...');
    
    const loginData = {
      email: 'admin@example.com',
      password: '123'
    };

    const response = await axios.post('http://localhost:3000/api/admin/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login successful!');
    console.log('📧 User:', response.data.user.email);
    console.log('👑 Role:', response.data.user.role);
    console.log('🔑 Access Token:', response.data.tokens.accessToken.substring(0, 50) + '...');
    console.log('🔄 Refresh Token:', response.data.tokens.refreshToken.substring(0, 50) + '...');
    
    // Test profile endpoint with the token
    console.log('\n🧪 Testing profile endpoint...');
    const profileResponse = await axios.get('http://localhost:3000/api/admin/auth/profile', {
      headers: {
        'Authorization': `Bearer ${response.data.tokens.accessToken}`
      }
    });
    
    console.log('✅ Profile retrieved successfully!');
    console.log('👤 Profile:', profileResponse.data.user.email);
    
  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAdminLogin();
}

module.exports = { testAdminLogin };
