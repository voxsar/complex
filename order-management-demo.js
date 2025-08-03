#!/usr/bin/env node

/**
 * Order Management System Demo Script
 * 
 * This script demonstrates the comprehensive order management features including:
 * - Order creation with multiple currencies
 * - Payment processing and tracking
 * - Fulfillment management
 * - Returns, claims, and exchanges
 * - Price lists and sales channels
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

async function createSalesChannel() {
  console.log('\n🏪 Creating Sales Channel...');
  
  const salesChannel = await apiRequest('POST', '/sales-channels', {
    name: 'Demo Web Store',
    description: 'Demo online storefront',
    isActive: true,
    isDefault: true,
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    defaultCurrency: 'USD',
    stockLocationIds: ['location_main'],
    shippingProfileIds: ['shipping_standard']
  });
  
  console.log('✅ Sales Channel created:', salesChannel.salesChannel.id);
  return salesChannel.salesChannel;
}

async function createPriceList() {
  console.log('\n💰 Creating Price List...');
  
  const priceList = await apiRequest('POST', '/price-lists', {
    title: 'Holiday Sale 2025',
    description: 'Special holiday pricing for all customers',
    type: 'sale',
    status: 'active',
    customerGroupIds: [],
    salesChannelIds: [],
    startsAt: '2025-08-01T00:00:00Z',
    endsAt: '2025-12-31T23:59:59Z',
    prices: [
      {
        productId: 'demo_product_1',
        variantId: 'demo_variant_1',
        currency: 'USD',
        amount: 89.99,
        minQuantity: 1,
        maxQuantity: null
      },
      {
        productId: 'demo_product_1',
        variantId: 'demo_variant_1',
        currency: 'EUR',
        amount: 79.99,
        minQuantity: 1,
        maxQuantity: null
      }
    ]
  });
  
  console.log('✅ Price List created:', priceList.priceList.id);
  return priceList.priceList;
}

async function createDemoOrder(salesChannelId, priceListId) {
  console.log('\n📦 Creating Demo Order...');
  
  const order = await apiRequest('POST', '/orders', {
    orderNumber: `DEMO-${Date.now()}`,
    status: 'pending',
    fulfillmentStatus: 'unfulfilled',
    financialStatus: 'pending',
    customerId: 'demo_customer_1',
    salesChannelId: salesChannelId,
    priceListId: priceListId,
    currency: 'USD',
    subtotal: 89.99,
    taxAmount: 7.20,
    shippingAmount: 9.99,
    discountAmount: 10.00,
    total: 97.18,
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Demo Street',
      city: 'Demo City',
      province: 'Demo State',
      country: 'USA',
      zip: '12345',
      phone: '+1-555-0123'
    },
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Demo Street',
      city: 'Demo City',
      province: 'Demo State',
      country: 'USA',
      zip: '12345',
      phone: '+1-555-0123'
    },
    items: [
      {
        id: 'demo_item_1',
        quantity: 1,
        price: 89.99,
        total: 89.99,
        productTitle: 'Demo Product',
        variantTitle: 'Standard',
        productSku: 'DEMO-001',
        variantId: 'demo_variant_1',
        productSnapshot: {
          product: {
            id: 'demo_product_1',
            title: 'Demo Product',
            images: ['demo_image_1.jpg']
          },
          variant: {
            id: 'demo_variant_1',
            title: 'Standard',
            sku: 'DEMO-001',
            price: 89.99,
            optionValues: [
              { option: 'Size', value: 'Medium' },
              { option: 'Color', value: 'Blue' }
            ]
          }
        }
      }
    ],
    note: 'Demo order for testing order management features'
  });
  
  console.log('✅ Order created:', order.id);
  return order;
}

async function addPaymentToOrder(orderId) {
  console.log('\n💳 Adding Payment to Order...');
  
  const payment = await apiRequest('POST', `/orders/${orderId}/payments`, {
    amount: 97.18,
    currency: 'USD',
    method: 'credit_card',
    reference: `payment_${Date.now()}`,
    gatewayTransactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
    gatewayResponse: {
      gateway: 'stripe',
      chargeId: 'ch_test_123456'
    }
  });
  
  console.log('✅ Payment added:', payment.payment.id);
  
  // Update payment status to paid
  console.log('💳 Updating Payment Status to Paid...');
  await apiRequest('PATCH', `/orders/${orderId}/payments/${payment.payment.id}`, {
    status: 'paid',
    gatewayResponse: {
      gateway: 'stripe',
      chargeId: 'ch_test_123456',
      status: 'succeeded'
    }
  });
  
  console.log('✅ Payment marked as paid');
  return payment.payment;
}

async function addFulfillmentToOrder(orderId, itemId) {
  console.log('\n📮 Adding Fulfillment to Order...');
  
  const fulfillment = await apiRequest('POST', `/orders/${orderId}/fulfillments`, {
    items: [
      {
        orderItemId: itemId,
        quantity: 1
      }
    ],
    trackingCompany: 'UPS',
    trackingNumber: `1Z999AA${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  console.log('✅ Fulfillment added:', fulfillment.fulfillment.id);
  
  // Update fulfillment status to shipped
  console.log('📮 Updating Fulfillment Status to Shipped...');
  await apiRequest('PATCH', `/orders/${orderId}/fulfillments/${fulfillment.fulfillment.id}`, {
    status: 'shipped'
  });
  
  console.log('✅ Fulfillment marked as shipped');
  return fulfillment.fulfillment;
}

async function createReturnRequest(orderId, itemId) {
  console.log('\n↩️ Creating Return Request...');
  
  const returnRequest = await apiRequest('POST', '/order-returns', {
    orderId: orderId,
    customerId: 'demo_customer_1',
    reason: 'not_as_described',
    items: [
      {
        orderItemId: itemId,
        quantity: 1,
        reason: 'Product color different from website photos',
        condition: 'new',
        restockable: true,
        refundAmount: 89.99
      }
    ],
    customerNote: 'The product color is different from what was shown on the website',
    refundAmount: 89.99,
    currency: 'USD'
  });
  
  console.log('✅ Return request created:', returnRequest.return.id);
  
  // Approve the return
  console.log('↩️ Approving Return Request...');
  await apiRequest('PATCH', `/order-returns/${returnRequest.return.id}/status`, {
    status: 'approved',
    adminNote: 'Return approved - customer can ship item back'
  });
  
  console.log('✅ Return request approved');
  return returnRequest.return;
}

async function createClaimRequest(orderId, itemId) {
  console.log('\n⚠️ Creating Claim Request...');
  
  const claim = await apiRequest('POST', '/order-claims', {
    orderId: orderId,
    customerId: 'demo_customer_1',
    type: 'damaged',
    items: [
      {
        orderItemId: itemId,
        quantity: 1,
        description: 'Package arrived with visible damage to the product',
        images: ['damage_photo_1.jpg', 'damage_photo_2.jpg'],
        replacement: {
          productId: 'demo_product_1',
          variantId: 'demo_variant_1',
          quantity: 1
        }
      }
    ],
    customerNote: 'Package was damaged during shipping, product has scratches',
    attachments: [
      {
        url: 'https://demo.com/damage_photo.jpg',
        filename: 'damage_photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024000
      }
    ]
  });
  
  console.log('✅ Claim created:', claim.claim.id);
  
  // Approve the claim with replacement
  console.log('⚠️ Approving Claim with Replacement...');
  await apiRequest('POST', `/order-claims/${claim.claim.id}/approve`, {
    replacementItems: [
      {
        claimItemId: claim.claim.items[0].id,
        productId: 'demo_product_1',
        variantId: 'demo_variant_1',
        quantity: 1
      }
    ],
    refundAmount: 0,
    resolutionNote: 'Replacement item will be shipped at no charge'
  });
  
  console.log('✅ Claim approved with replacement');
  return claim.claim;
}

async function createExchangeRequest(orderId, itemId) {
  console.log('\n🔄 Creating Exchange Request...');
  
  const exchange = await apiRequest('POST', '/order-exchanges', {
    orderId: orderId,
    customerId: 'demo_customer_1',
    returnItems: [
      {
        orderItemId: itemId,
        quantity: 1,
        reason: 'Wrong size - need larger',
        condition: 'new'
      }
    ],
    exchangeItems: [
      {
        productId: 'demo_product_2',
        variantId: 'demo_variant_2',
        quantity: 1,
        price: 109.99,
        productTitle: 'Demo Product (Large)',
        variantTitle: 'Large'
      }
    ],
    reason: 'Size exchange',
    customerNote: 'Need to exchange for larger size',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Demo Street',
      city: 'Demo City',
      province: 'Demo State',
      country: 'USA',
      zip: '12345'
    }
  });
  
  console.log('✅ Exchange request created:', exchange.exchange.id);
  console.log(`💰 Additional amount to pay: $${exchange.exchange.additionalAmount}`);
  
  // Approve the exchange
  console.log('🔄 Approving Exchange...');
  await apiRequest('POST', `/order-exchanges/${exchange.exchange.id}/approve`, {
    adminNote: 'Exchange approved - customer can ship original item back'
  });
  
  console.log('✅ Exchange approved');
  return exchange.exchange;
}

async function getOrderSummaries(orderId) {
  console.log('\n📊 Getting Order Summaries...');
  
  // Financial summary
  const financial = await apiRequest('GET', `/orders/${orderId}/financial-summary`);
  console.log('💰 Financial Summary:');
  console.log(`   Total: $${financial.total} ${financial.currency}`);
  console.log(`   Paid: $${financial.totalPaid}`);
  console.log(`   Refunded: $${financial.totalRefunded}`);
  console.log(`   Balance: $${financial.remainingBalance}`);
  console.log(`   Status: ${financial.isPaid ? 'Paid' : 'Unpaid'}`);
  
  // Fulfillment summary
  const fulfillment = await apiRequest('GET', `/orders/${orderId}/fulfillment-summary`);
  console.log('📦 Fulfillment Summary:');
  console.log(`   Total Items: ${fulfillment.totalItems}`);
  console.log(`   Fulfilled: ${fulfillment.fulfilledItems}`);
  console.log(`   Remaining: ${fulfillment.remainingItems}`);
  console.log(`   Status: ${fulfillment.isFulfilled ? 'Fulfilled' : 'Pending'}`);
  
  // Returns/Claims/Exchanges summary
  const rce = await apiRequest('GET', `/orders/${orderId}/returns-claims-exchanges`);
  console.log('🔄 Returns/Claims/Exchanges Summary:');
  console.log(`   Returns: ${rce.counts.returns}`);
  console.log(`   Claims: ${rce.counts.claims}`);
  console.log(`   Exchanges: ${rce.counts.exchanges}`);
}

async function checkPriceListPricing() {
  console.log('\n💲 Checking Price List Pricing...');
  
  const prices = await apiRequest('GET', '/price-lists/product/demo_product_1/prices?currency=USD&quantity=1');
  console.log('💰 Available Prices:');
  prices.prices.forEach(price => {
    console.log(`   ${price.priceListTitle}: $${price.amount} ${price.currency}`);
    console.log(`   Type: ${price.priceListType}`);
    if (price.minQuantity) console.log(`   Min Qty: ${price.minQuantity}`);
  });
}

async function runDemo() {
  console.log('🚀 Starting Order Management System Demo');
  console.log('==========================================');
  
  try {
    // 1. Create sales channel
    const salesChannel = await createSalesChannel();
    
    // 2. Create price list
    const priceList = await createPriceList();
    
    // 3. Check pricing
    await checkPriceListPricing();
    
    // 4. Create order
    const order = await createDemoOrder(salesChannel.id, priceList.id);
    const orderId = order.id;
    const itemId = order.items[0].id;
    
    // 5. Add and process payment
    await addPaymentToOrder(orderId);
    
    // 6. Add fulfillment
    await addFulfillmentToOrder(orderId, itemId);
    
    // 7. Create return request
    await createReturnRequest(orderId, itemId);
    
    // 8. Create claim request
    await createClaimRequest(orderId, itemId);
    
    // 9. Create exchange request
    await createExchangeRequest(orderId, itemId);
    
    // 10. Get comprehensive summaries
    await getOrderSummaries(orderId);
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('==========================================');
    console.log(`📋 Order ID: ${orderId}`);
    console.log('🌐 API Base URL:', API_BASE);
    console.log('\n📚 Check ORDER_MANAGEMENT_API.md for complete API documentation');
    
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
