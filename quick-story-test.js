#!/usr/bin/env node

/**
 * 🛍️ Quick E-commerce Story Test
 * 
 * A streamlined version of the complete story test that focuses on the essential customer journey:
 * 1. Setup basic products (if needed)
 * 2. Customer registration
 * 3. Shopping and cart management
 * 4. Checkout and order placement
 * 5. Basic post-order operations
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function for API requests
async function apiRequest(method, endpoint, data = null, authToken = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${result.error || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

// Test context
const testContext = {
  customer: null,
  products: [],
  cart: null,
  order: null
};

async function checkAndSetupProducts() {
  console.log('\n📦 Checking product availability...');
  
  try {
    const products = await apiRequest('GET', '/products?limit=5');
    
    if (products.products && products.products.length > 0) {
      testContext.products = products.products;
      console.log(`✅ Found ${products.products.length} existing products`);
      
      products.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} - $${product.variants[0]?.price || 'N/A'}`);
      });
      
      return true;
    } else {
      console.log('⚠️ No products found. The system needs products to test the customer journey.');
      console.log('💡 Please run the complete story test first or add products manually.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to check products:', error.message);
    return false;
  }
}

async function customerJourney() {
  console.log('\n👤 Starting Customer Journey...');
  console.log('=====================================');
  
  // Customer registration
  console.log('\n📝 Step 1: Customer Registration...');
  
  try {
    const customerEmail = `test.customer.${Date.now()}@email.com`;
    
    const customerRegistration = await apiRequest('POST', '/users/register', {
      email: customerEmail,
      password: 'testpassword123',
      firstName: 'Alex',
      lastName: 'Smith',
      phone: '+1-555-0123'
    });
    
    console.log('✅ Customer registered successfully');
    console.log(`   Email: ${customerEmail}`);
    console.log(`   Name: ${customerRegistration.user.firstName} ${customerRegistration.user.lastName}`);
    
    // Login
    const customerLogin = await apiRequest('POST', '/users/login', {
      email: customerEmail,
      password: 'testpassword123'
    });
    
    testContext.customer = customerLogin;
    console.log('✅ Customer logged in');
    
  } catch (error) {
    console.error('❌ Customer registration failed:', error.message);
    throw error;
  }
}

async function shoppingExperience() {
  console.log('\n🛒 Step 2: Shopping Experience...');
  
  try {
    // Create cart
    console.log('🆕 Creating shopping cart...');
    
    const cart = await apiRequest('POST', '/carts', {
      customerId: testContext.customer.user.id,
      email: testContext.customer.user.email,
      currency: 'USD',
      sessionId: `test_session_${Date.now()}`,
      type: 'default'
    });
    
    testContext.cart = cart.cart;
    console.log(`✅ Cart created: ${testContext.cart.id}`);
    
    // Add products to cart
    console.log('➕ Adding products to cart...');
    
    const product1 = testContext.products[0];
    const variant1 = product1.variants[0];
    
    await apiRequest('POST', `/carts/${testContext.cart.id}/line-items`, {
      productId: product1.id,
      variantId: variant1.id,
      quantity: 1,
      metadata: { source: 'quick-test' }
    });
    
    console.log(`✅ Added: ${product1.title}`);
    
    // Add second product if available
    if (testContext.products.length > 1) {
      const product2 = testContext.products[1];
      const variant2 = product2.variants[0];
      
      await apiRequest('POST', `/carts/${testContext.cart.id}/line-items`, {
        productId: product2.id,
        variantId: variant2.id,
        quantity: 1,
        metadata: { source: 'quick-test' }
      });
      
      console.log(`✅ Added: ${product2.title}`);
    }
    
    // Add shipping address
    console.log('🏠 Adding shipping address...');
    
    const updatedCart = await apiRequest('PATCH', `/carts/${testContext.cart.id}/addresses`, {
      billingAddress: {
        firstName: 'Alex',
        lastName: 'Smith',
        address1: '123 Test Street',
        city: 'Test City',
        province: 'CA',
        country: 'US',
        zip: '12345',
        phone: '+1-555-0123'
      },
      shippingAddress: {
        firstName: 'Alex',
        lastName: 'Smith',
        address1: '123 Test Street',
        city: 'Test City',
        province: 'CA',
        country: 'US',
        zip: '12345',
        phone: '+1-555-0123'
      }
    });
    
    testContext.cart = updatedCart.cart;
    console.log('✅ Addresses added');
    
    // Set shipping method
    console.log('🚚 Setting shipping method...');
    
    const cartWithShipping = await apiRequest('POST', `/carts/${testContext.cart.id}/shipping-methods`, {
      shippingOptionId: 'standard_shipping',
      name: 'Standard Shipping (5-7 days)',
      price: 9.99
    });
    
    testContext.cart = cartWithShipping.cart;
    console.log('✅ Shipping method set');
    
    // Display cart summary
    console.log('\n📊 Cart Summary:');
    console.log(`   Items: ${testContext.cart.itemsCount}`);
    console.log(`   Subtotal: $${testContext.cart.subtotal}`);
    console.log(`   Shipping: $${testContext.cart.shippingAmount || 0}`);
    console.log(`   Total: $${testContext.cart.total} ${testContext.cart.currency}`);
    
  } catch (error) {
    console.error('❌ Shopping experience failed:', error.message);
    throw error;
  }
}

async function checkoutProcess() {
  console.log('\n💳 Step 3: Checkout Process...');
  
  try {
    // Validate cart
    console.log('✅ Validating cart for checkout...');
    
    const validation = await apiRequest('GET', `/carts/${testContext.cart.id}/checkout-summary`);
    
    if (!validation.readyForCheckout) {
      console.log('❌ Cart not ready for checkout:');
      validation.validation.errors.forEach(error => console.log(`   - ${error}`));
      throw new Error('Cart validation failed');
    }
    
    console.log('✅ Cart validation passed');
    
    // Convert to order
    console.log('🎯 Creating order...');
    
    const order = await apiRequest('POST', `/carts/${testContext.cart.id}/checkout`, {
      note: 'Quick test order',
      tags: ['quick-test'],
      metadata: {
        source: 'quick-story-test',
        timestamp: new Date().toISOString()
      }
    });
    
    testContext.order = order.order;
    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${testContext.order.id}`);
    console.log(`   Order Number: ${testContext.order.orderNumber}`);
    console.log(`   Total: $${testContext.order.total}`);
    
  } catch (error) {
    console.error('❌ Checkout process failed:', error.message);
    throw error;
  }
}

async function orderSummary() {
  console.log('\n📋 Step 4: Order Summary...');
  
  try {
    // Get order details
    const orderDetails = await apiRequest('GET', `/orders/${testContext.order.id}`);
    
    console.log('📦 Order Details:');
    console.log(`   Order Number: ${orderDetails.orderNumber}`);
    console.log(`   Status: ${orderDetails.status}`);
    console.log(`   Customer: ${orderDetails.customerEmail}`);
    console.log(`   Items: ${orderDetails.itemsCount}`);
    console.log(`   Total: $${orderDetails.total} ${orderDetails.currency}`);
    console.log(`   Created: ${new Date(orderDetails.createdAt).toLocaleString()}`);
    
    console.log('\n📝 Order Items:');
    orderDetails.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.productTitle} - ${item.variantTitle}`);
      console.log(`      Quantity: ${item.quantity} × $${item.unitPrice} = $${item.totalPrice}`);
    });
    
    // Check cart status
    const cartStatus = await apiRequest('GET', `/carts/${testContext.cart.id}`);
    console.log(`\n🛒 Cart Status: ${cartStatus.cart.status}`);
    console.log(`   Linked Order: ${cartStatus.cart.orderId || 'None'}`);
    
  } catch (error) {
    console.error('❌ Order summary failed:', error.message);
    throw error;
  }
}

async function runQuickStoryTest() {
  console.log('🚀 Quick E-commerce Story Test');
  console.log('===============================');
  console.log('');
  console.log('This streamlined test simulates a basic customer journey:');
  console.log('📝 Customer registration');
  console.log('🛒 Product selection and cart management');
  console.log('💳 Checkout and order creation');
  console.log('📋 Order confirmation');
  console.log('');
  
  try {
    // Check if products exist
    const hasProducts = await checkAndSetupProducts();
    
    if (!hasProducts) {
      console.log('\n💡 To run a complete test with product setup, use:');
      console.log('   node ecommerce-story-test.js');
      return;
    }
    
    // Run customer journey
    await customerJourney();
    await shoppingExperience();
    await checkoutProcess();
    await orderSummary();
    
    console.log('\n🎉 QUICK STORY TEST COMPLETED SUCCESSFULLY! 🎉');
    console.log('==============================================');
    console.log('');
    console.log('✅ Customer Registration ✅ Cart Management ✅ Order Creation');
    console.log('');
    console.log(`📧 Test Customer: ${testContext.customer.user.email}`);
    console.log(`🛒 Cart ID: ${testContext.cart.id}`);
    console.log(`📦 Order Number: ${testContext.order.orderNumber}`);
    console.log(`💰 Order Total: $${testContext.order.total}`);
    console.log('');
    console.log('🔗 Next steps to test:');
    console.log('   - Payment processing');
    console.log('   - Order fulfillment');
    console.log('   - Customer support features');
    console.log('');
    console.log('💡 Run the complete story test for full coverage:');
    console.log('   node ecommerce-story-test.js');
    
  } catch (error) {
    console.error('\n❌ QUICK STORY TEST FAILED:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Ensure the development server is running (npm run dev)');
    console.log('   2. Check if the database is properly configured');
    console.log('   3. Verify API endpoints are accessible');
    console.log('   4. Run database migrations if needed');
    process.exit(1);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.log('💡 Install Node.js 18+ or run: npm install node-fetch');
  process.exit(1);
}

// Run the quick story test
runQuickStoryTest().catch(console.error);
