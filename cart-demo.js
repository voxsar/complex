#!/usr/bin/env node

/**
 * Cart Management System Demo Script
 * 
 * This script demonstrates the comprehensive cart management features including:
 * - Cart creation and management
 * - Line item operations (add, update, remove)
 * - Address management
 * - Discount application
 * - Shipping method selection
 * - Tax calculations
 * - Cart to order conversion
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function to make API requests
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
    
    if (!response.ok) {
      throw new Error(`API Error: ${result.error || response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

async function createDemoCart() {
  console.log('\n🛒 Creating Demo Cart...');
  
  const cart = await apiRequest('POST', '/carts', {
    customerId: 'demo_customer_1',
    email: 'john.doe@example.com',
    currency: 'USD',
    salesChannelId: 'demo_channel_1',
    regionId: 'US',
    sessionId: `session_${Date.now()}`,
    type: 'default'
  });
  
  console.log('✅ Cart created:', cart.cart.id);
  console.log(`   Status: ${cart.cart.status}`);
  console.log(`   Currency: ${cart.cart.currency}`);
  console.log(`   Items: ${cart.cart.itemsCount}`);
  console.log(`   Total: $${cart.cart.total}`);
  
  return cart.cart;
}

async function getAvailableProducts() {
  console.log('\n🔍 Fetching Available Products...');
  
  const response = await apiRequest('GET', '/products');
  const products = response.products;
  
  if (!products || products.length === 0) {
    throw new Error('No products available in the database');
  }
  
  console.log(`✅ Found ${products.length} products`);
  return products;
}

async function addItemsToCart(cartId) {
  console.log('\n📦 Adding Items to Cart...');
  
  // Get available products first
  const products = await getAvailableProducts();
  
  // Use the first product for demo
  const product1 = products[0];
  const variant1 = product1.variants[0];
  
  // Add first item
  const item1 = await apiRequest('POST', `/carts/${cartId}/line-items`, {
    productId: product1.id,
    variantId: variant1.id,
    quantity: 2,
    metadata: { source: 'demo' }
  });
  
  console.log('✅ Added Product 1:', product1.title);
  console.log(`   Variant: ${variant1.title}`);
  console.log(`   Quantity: 2`);
  console.log(`   Unit Price: $${variant1.price}`);
  
  // Add second item if there's another product available
  if (products.length > 1) {
    const product2 = products[1];
    const variant2 = product2.variants[0];
    
    const item2 = await apiRequest('POST', `/carts/${cartId}/line-items`, {
      productId: product2.id,
      variantId: variant2.id,
      quantity: 1,
      metadata: { source: 'demo' }
    });
    
    console.log('✅ Added Product 2:', product2.title);
    console.log(`   Variant: ${variant2.title}`);
    console.log(`   Quantity: 1`);
    console.log(`   Unit Price: $${variant2.price}`);
    
    return item2.cart;
  } else {
    // If only one product, add it again with different quantity
    const item2 = await apiRequest('POST', `/carts/${cartId}/line-items`, {
      productId: product1.id,
      variantId: variant1.id,
      quantity: 1,
      metadata: { source: 'demo', note: 'second_item' }
    });
    
    console.log('✅ Added same product again with quantity 1');
    return item2.cart;
  }
}

async function updateCartAddresses(cartId) {
  console.log('\n🏠 Setting Cart Addresses...');
  
  const cart = await apiRequest('PATCH', `/carts/${cartId}/addresses`, {
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Demo Company Inc.',
      address1: '123 Demo Street',
      address2: 'Suite 100',
      city: 'Demo City',
      province: 'CA',
      country: 'US',
      zip: '90210',
      phone: '+1-555-0123'
    },
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '456 Shipping Lane',
      city: 'Demo City',
      province: 'CA',
      country: 'US',
      zip: '90210',
      phone: '+1-555-0123'
    }
  });
  
  console.log('✅ Addresses updated');
  console.log(`   Billing: ${cart.cart.billingAddress?.address1}, ${cart.cart.billingAddress?.city}`);
  console.log(`   Shipping: ${cart.cart.shippingAddress?.address1}, ${cart.cart.shippingAddress?.city}`);
  console.log(`   Has Billing Address: ${cart.cart.hasBillingAddress}`);
  console.log(`   Has Shipping Address: ${cart.cart.hasShippingAddress}`);
  
  return cart.cart;
}

async function setShippingMethod(cartId) {
  console.log('\n🚚 Setting Shipping Method...');
  
  const response = await apiRequest('POST', `/carts/${cartId}/shipping-methods`, {
    shippingOptionId: 'standard_shipping',
    name: 'Standard Shipping (5-7 business days)',
    price: 9.99,
    data: {
      carrier: 'UPS',
      estimatedDays: 6
    }
  });
  
  const cart = response.cart;
  const shippingMethod = cart.selectedShippingMethod;
  
  console.log('✅ Shipping method set:', shippingMethod?.name || 'Standard Shipping');
  console.log(`   Price: $${shippingMethod?.price || 9.99}`);
  console.log(`   Shipping Amount: $${cart.shippingAmount}`);
  console.log(`   Updated Total: $${cart.total}`);
  
  return cart;
}

async function applyDiscountToCart(cartId) {
  console.log('\n💸 Applying Discount...');
  
  try {
    // First, let's try to create a promotion for demo purposes
    const promotion = await apiRequest('POST', '/promotions', {
      name: 'Demo Cart Discount',
      description: '10% off for demo purposes',
      type: 'percentage',
      status: 'active',
      discountValue: 10,
      minimumOrderAmount: 50,
      targetType: 'all',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });
    
    console.log('📝 Created demo promotion:', promotion.promotion.id);
    
    // Apply the discount
    const cart = await apiRequest('POST', `/carts/${cartId}/discounts`, {
      promotionId: promotion.promotion.id
    });
    
    console.log('✅ Discount applied:', cart.cart.discounts[0].promotionTitle);
    console.log(`   Discount Type: ${cart.cart.discounts[0].type}`);
    console.log(`   Discount Value: ${cart.cart.discounts[0].value}%`);
    console.log(`   Discount Amount: $${cart.cart.discounts[0].discountAmount}`);
    console.log(`   Updated Total: $${cart.cart.total}`);
    
    return cart.cart;
  } catch (error) {
    console.log('⚠️ Could not apply discount (promotion system might not be ready)');
    console.log('   Continuing without discount...');
    
    // Get current cart state
    const cart = await apiRequest('GET', `/carts/${cartId}`);
    return cart.cart;
  }
}

async function getCheckoutSummary(cartId) {
  console.log('\n📊 Getting Checkout Summary...');
  
  const summary = await apiRequest('GET', `/carts/${cartId}/checkout-summary`);
  
  console.log('🛒 Cart Summary:');
  console.log(`   Items: ${summary.totals.itemsCount}`);
  console.log(`   Subtotal: $${summary.totals.subtotal}`);
  console.log(`   Tax: $${summary.totals.taxAmount}`);
  console.log(`   Shipping: $${summary.totals.shippingAmount}`);
  console.log(`   Discount: -$${summary.totals.discountAmount}`);
  console.log(`   Total: $${summary.totals.total} ${summary.totals.currency}`);
  
  console.log('\n✅ Validation Results:');
  console.log(`   Ready for Checkout: ${summary.readyForCheckout}`);
  console.log(`   Valid: ${summary.validation.isValid}`);
  
  if (summary.validation.errors.length > 0) {
    console.log('   Errors:');
    summary.validation.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (summary.validation.warnings.length > 0) {
    console.log('   Warnings:');
    summary.validation.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  return summary;
}

async function convertCartToOrder(cartId) {
  console.log('\n🎯 Converting Cart to Order...');
  
  const order = await apiRequest('POST', `/carts/${cartId}/checkout`, {
    note: 'Demo order created from cart conversion',
    adminNote: 'Created via cart demo script',
    tags: ['demo', 'cart-conversion'],
    metadata: {
      source: 'cart-demo',
      timestamp: new Date().toISOString()
    }
  });
  
  console.log('✅ Order created successfully!');
  console.log(`   Order ID: ${order.order.id}`);
  console.log(`   Order Number: ${order.order.orderNumber}`);
  console.log(`   Status: ${order.order.status}`);
  console.log(`   Total: $${order.order.total} ${order.order.currency}`);
  console.log(`   Items: ${order.order.itemsCount}`);
  
  // Verify cart is now completed
  const completedCart = await apiRequest('GET', `/carts/${cartId}`);
  console.log(`   Cart Status: ${completedCart.cart.status}`);
  console.log(`   Linked Order: ${completedCart.cart.orderId}`);
  
  return order.order;
}

async function demonstrateCartOperations(cartId) {
  console.log('\n🔧 Demonstrating Cart Operations...');
  
  // Get cart current state
  let cart = await apiRequest('GET', `/carts/${cartId}`);
  const itemId = cart.cart.items[0].id;
  
  console.log(`   Current first item quantity: ${cart.cart.items[0].quantity}`);
  
  // Update line item quantity
  cart = await apiRequest('PATCH', `/carts/${cartId}/line-items/${itemId}`, {
    quantity: 3
  });
  
  console.log(`   Updated first item quantity: ${cart.cart.items[0].quantity}`);
  console.log(`   New subtotal: $${cart.cart.subtotal}`);
  
  // Update cart details
  cart = await apiRequest('PATCH', `/carts/${cartId}`, {
    customerNote: 'Please handle with care - fragile items',
    metadata: {
      preferredDeliveryTime: 'morning',
      giftWrap: true
    }
  });
  
  console.log(`   Customer note: ${cart.cart.customerNote}`);
  console.log(`   Metadata updated: ${Object.keys(cart.cart.metadata || {}).length} fields`);
  
  return cart.cart;
}

async function listCarts() {
  console.log('\n📋 Listing All Carts...');
  
  const response = await apiRequest('GET', '/carts?limit=5&sortBy=updatedAt&sortOrder=desc');
  
  console.log(`📊 Found ${response.carts.length} carts (total: ${response.pagination.total})`);
  
  response.carts.forEach((cart, index) => {
    console.log(`   ${index + 1}. Cart ${cart.id.slice(-8)}...`);
    console.log(`      Status: ${cart.status}`);
    console.log(`      Items: ${cart.itemsCount}`);
    console.log(`      Total: $${cart.total} ${cart.currency}`);
    console.log(`      Updated: ${new Date(cart.updatedAt).toLocaleString()}`);
  });
}

async function runDemo() {
  console.log('🚀 Starting Cart Management System Demo');
  console.log('==========================================');
  
  try {
    // 1. Create a new cart
    const cart = await createDemoCart();
    const cartId = cart.id;
    
    // 2. Add items to cart
    await addItemsToCart(cartId);
    
    // 3. Update cart with addresses
    await updateCartAddresses(cartId);
    
    // 4. Set shipping method
    await setShippingMethod(cartId);
    
    // 5. Apply discount
    await applyDiscountToCart(cartId);
    
    // 6. Demonstrate cart operations
    await demonstrateCartOperations(cartId);
    
    // 7. Get checkout summary
    await getCheckoutSummary(cartId);
    
    // 8. Convert cart to order
    await convertCartToOrder(cartId);
    
    // 9. List all carts
    await listCarts();
    
    console.log('\n🎉 Cart Demo completed successfully!');
    console.log('==========================================');
    console.log(`📋 Cart ID: ${cartId}`);
    console.log('🌐 API Base URL:', API_BASE);
    console.log('\n📚 Key Features Demonstrated:');
    console.log('   ✅ Cart creation and management');
    console.log('   ✅ Line item operations');
    console.log('   ✅ Address management');
    console.log('   ✅ Shipping method selection');
    console.log('   ✅ Discount application');
    console.log('   ✅ Checkout validation');
    console.log('   ✅ Cart to order conversion');
    console.log('\nCheck the CART_MODULE_GUIDE.md for complete API documentation');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.log('💡 Install a fetch polyfill: npm install node-fetch');
  console.log('💡 Or use Node.js 18+');
  process.exit(1);
}

// Run the demo
runDemo().catch(console.error);
