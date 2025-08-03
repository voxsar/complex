/**
 * Customer Authentication Testing Script
 * 
 * Run this after starting your server to test customer auth features
 */

const BASE_URL = "http://localhost:3000/api";

// Test customer registration
const testRegistration = async () => {
  console.log("🧪 Testing Customer Registration...");
  
  const response = await fetch(`${BASE_URL}/customers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test.customer@example.com",
      password: "testPassword123",
      firstName: "Test",
      lastName: "Customer",
      phone: "+1234567890",
      dateOfBirth: "1990-05-15",
      acceptsMarketing: true
    })
  });
  
  const data = await response.json();
  console.log("Registration Response:", data);
  
  if (data.token) {
    console.log("✅ Registration successful!");
    return data.token;
  } else {
    console.log("❌ Registration failed:", data.error);
    return null;
  }
};

// Test customer login
const testLogin = async () => {
  console.log("\n🧪 Testing Customer Login...");
  
  const response = await fetch(`${BASE_URL}/customers/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test.customer@example.com",
      password: "testPassword123"
    })
  });
  
  const data = await response.json();
  console.log("Login Response:", data);
  
  if (data.token) {
    console.log("✅ Login successful!");
    return data.token;
  } else {
    console.log("❌ Login failed:", data.error);
    return null;
  }
};

// Test protected routes
const testProtectedRoutes = async (token) => {
  console.log("\n🧪 Testing Protected Routes...");
  
  // Test customer profile
  const profileResponse = await fetch(`${BASE_URL}/customers/profile`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const profileData = await profileResponse.json();
  console.log("Profile Response:", profileData);
  
  // Test loyalty dashboard
  const loyaltyResponse = await fetch(`${BASE_URL}/customers/loyalty`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const loyaltyData = await loyaltyResponse.json();
  console.log("Loyalty Dashboard:", loyaltyData);
};

// Test demo routes
const testDemoRoutes = async (token) => {
  console.log("\n🧪 Testing Demo Routes...");
  
  // Test public route
  const publicResponse = await fetch(`${BASE_URL}/customer-demo/public`);
  const publicData = await publicResponse.json();
  console.log("Public Route:", publicData.message);
  
  // Test protected route
  const protectedResponse = await fetch(`${BASE_URL}/customer-demo/protected`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const protectedData = await protectedResponse.json();
  console.log("Protected Route:", protectedData.message);
  
  // Test permissions
  const permissionsResponse = await fetch(`${BASE_URL}/customer-demo/permissions`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const permissionsData = await permissionsResponse.json();
  console.log("Permissions:", permissionsData.accessLevels);
};

// Run all tests
const runTests = async () => {
  try {
    console.log("🚀 Starting Customer Authentication Tests...\n");
    
    // Try registration first, then login if registration fails (user might already exist)
    let token = await testRegistration();
    
    if (!token) {
      token = await testLogin();
    }
    
    if (token) {
      await testProtectedRoutes(token);
      await testDemoRoutes(token);
      
      console.log("\n✅ All tests completed successfully!");
      console.log("\n📋 Available Endpoints:");
      console.log("• GET /api/customer-demo/public - Public access");
      console.log("• GET /api/customer-demo/protected - Requires auth");
      console.log("• GET /api/customer-demo/permissions - Check your access");
      console.log("• GET /api/customers/profile - Customer profile");
      console.log("• GET /api/customers/loyalty - Loyalty dashboard");
    } else {
      console.log("❌ Could not authenticate. Tests aborted.");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testRegistration, testLogin, testProtectedRoutes, testDemoRoutes };
} else if (typeof window !== 'undefined') {
  window.customerAuthTests = { runTests, testRegistration, testLogin, testProtectedRoutes, testDemoRoutes };
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}
