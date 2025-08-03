// Demo script for Shipping & Fulfillment System
// This script demonstrates the complete shipping workflow

const API_BASE = 'http://localhost:3000/api';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return response.json();
}

// Demo functions
async function setupShippingDemo() {
  console.log('\n🚚 Setting up Shipping & Fulfillment Demo...\n');

  try {
    // 1. Create Shipping Zones
    console.log('1. Creating Shipping Zones...');
    
    const northAmericaZone = await apiCall('/shipping-zones', 'POST', {
      name: 'North America',
      description: 'US, Canada, and Mexico',
      countries: ['US', 'CA', 'MX'],
      states: [],
      cities: [],
      postalCodes: ['*'],
      isActive: true,
      priority: 1
    });
    console.log('   ✅ Created North America zone:', northAmericaZone.id);

    const europeZone = await apiCall('/shipping-zones', 'POST', {
      name: 'Europe',
      description: 'European Union countries',
      countries: ['DE', 'FR', 'GB', 'IT', 'ES', 'NL'],
      states: [],
      cities: [],
      postalCodes: ['*'],
      isActive: true,
      priority: 2
    });
    console.log('   ✅ Created Europe zone:', europeZone.id);

    // 2. Create Shipping Providers
    console.log('\n2. Creating Shipping Providers...');
    
    const upsProvider = await apiCall('/shipping-providers', 'POST', {
      name: 'UPS',
      type: 'UPS',
      description: 'United Parcel Service',
      isActive: true,
      isTestMode: true,
      apiEndpoint: 'https://onlinetools.ups.com/api',
      supportedServices: [
        { serviceCode: 'GROUND', serviceName: 'UPS Ground', description: 'Standard ground shipping' },
        { serviceCode: 'EXPRESS', serviceName: 'UPS Express', description: 'Next day delivery' }
      ]
    });
    console.log('   ✅ Created UPS provider:', upsProvider.id);

    const fedexProvider = await apiCall('/shipping-providers', 'POST', {
      name: 'FedEx',
      type: 'FEDEX',
      description: 'Federal Express',
      isActive: true,
      isTestMode: true,
      apiEndpoint: 'https://apis.fedex.com',
      supportedServices: [
        { serviceCode: 'FEDEX_GROUND', serviceName: 'FedEx Ground', description: 'Economy ground shipping' },
        { serviceCode: 'FEDEX_EXPRESS', serviceName: 'FedEx Express', description: 'Overnight delivery' }
      ]
    });
    console.log('   ✅ Created FedEx provider:', fedexProvider.id);

    // 3. Create Fulfillment Centers
    console.log('\n3. Creating Fulfillment Centers...');
    
    const westCoastCenter = await apiCall('/fulfillment-centers', 'POST', {
      name: 'West Coast Warehouse',
      code: 'WCW-001',
      address1: '123 Warehouse Street',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      postalCode: '90210',
      phone: '+1-555-0123',
      email: 'westcoast@warehouse.com',
      canShip: true,
      canReceive: true,
      canProcess: true,
      isDefault: true,
      supportedShippingZones: [northAmericaZone.id],
      priority: 1,
      operatingHours: {
        monday: { open: '08:00', close: '17:00' },
        tuesday: { open: '08:00', close: '17:00' },
        wednesday: { open: '08:00', close: '17:00' },
        thursday: { open: '08:00', close: '17:00' },
        friday: { open: '08:00', close: '17:00' }
      }
    });
    console.log('   ✅ Created West Coast center:', westCoastCenter.id);

    const eastCoastCenter = await apiCall('/fulfillment-centers', 'POST', {
      name: 'East Coast Distribution',
      code: 'ECD-001',
      address1: '456 Distribution Ave',
      city: 'New York',
      state: 'NY',
      country: 'US',
      postalCode: '10001',
      phone: '+1-555-0456',
      email: 'eastcoast@warehouse.com',
      canShip: true,
      canReceive: true,
      canProcess: false,
      isDefault: false,
      supportedShippingZones: [northAmericaZone.id],
      priority: 2
    });
    console.log('   ✅ Created East Coast center:', eastCoastCenter.id);

    // 4. Create Shipping Rates
    console.log('\n4. Creating Shipping Rates...');
    
    const standardRate = await apiCall('/shipping-rates', 'POST', {
      name: 'Standard Shipping',
      description: 'Free shipping on orders over $50',
      shippingZoneId: northAmericaZone.id,
      shippingProviderId: upsProvider.id,
      type: 'FLAT_RATE',
      flatRate: 9.99,
      freeShippingThreshold: 50.00,
      minDeliveryDays: 3,
      maxDeliveryDays: 7,
      isActive: true,
      priority: 1
    });
    console.log('   ✅ Created standard rate:', standardRate.id);

    const expressRate = await apiCall('/shipping-rates', 'POST', {
      name: 'Express Shipping',
      description: 'Next day delivery',
      shippingZoneId: northAmericaZone.id,
      shippingProviderId: fedexProvider.id,
      type: 'FLAT_RATE',
      flatRate: 24.99,
      minDeliveryDays: 1,
      maxDeliveryDays: 2,
      isActive: true,
      priority: 2
    });
    console.log('   ✅ Created express rate:', expressRate.id);

    const weightBasedRate = await apiCall('/shipping-rates', 'POST', {
      name: 'Weight-Based Shipping',
      description: 'Shipping based on package weight',
      shippingZoneId: europeZone.id,
      type: 'WEIGHT_BASED',
      weightRate: 3.50,
      minWeight: 0.1,
      maxWeight: 30.0,
      minDeliveryDays: 5,
      maxDeliveryDays: 10,
      isActive: true,
      priority: 1
    });
    console.log('   ✅ Created weight-based rate:', weightBasedRate.id);

    return {
      zones: { northAmerica: northAmericaZone, europe: europeZone },
      providers: { ups: upsProvider, fedex: fedexProvider },
      centers: { westCoast: westCoastCenter, eastCoast: eastCoastCenter },
      rates: { standard: standardRate, express: expressRate, weightBased: weightBasedRate }
    };

  } catch (error) {
    console.error('❌ Error setting up shipping demo:', error);
    throw error;
  }
}

async function testShippingCalculation() {
  console.log('\n📊 Testing Shipping Rate Calculation...\n');

  try {
    // Test 1: Calculate rates for US address with high order value (free shipping)
    console.log('Test 1: US order over $50 (should get free standard shipping)');
    const rates1 = await apiCall('/shipping-rates/calculate', 'POST', {
      shippingAddress: {
        country: 'US',
        state: 'CA',
        city: 'Los Angeles',
        postalCode: '90210'
      },
      items: [
        { productId: 'prod-1', quantity: 2, weight: 1.5 },
        { productId: 'prod-2', quantity: 1, weight: 0.8 }
      ],
      subtotal: 75.00,
      weight: 3.8
    });
    console.log('   Available rates:', rates1.rates.length);
    rates1.rates.forEach(rate => {
      console.log(`   - ${rate.name}: $${rate.cost} (${rate.estimatedDays.min}-${rate.estimatedDays.max} days)`);
    });

    // Test 2: Calculate rates for US address with low order value
    console.log('\nTest 2: US order under $50');
    const rates2 = await apiCall('/shipping-rates/calculate', 'POST', {
      shippingAddress: {
        country: 'US',
        state: 'NY',
        city: 'New York',
        postalCode: '10001'
      },
      items: [
        { productId: 'prod-1', quantity: 1, weight: 0.5 }
      ],
      subtotal: 25.00,
      weight: 0.5
    });
    console.log('   Available rates:', rates2.rates.length);
    rates2.rates.forEach(rate => {
      console.log(`   - ${rate.name}: $${rate.cost} (${rate.estimatedDays.min}-${rate.estimatedDays.max} days)`);
    });

    // Test 3: Calculate rates for European address
    console.log('\nTest 3: European order (weight-based shipping)');
    const rates3 = await apiCall('/shipping-rates/calculate', 'POST', {
      shippingAddress: {
        country: 'DE',
        state: 'Berlin',
        city: 'Berlin',
        postalCode: '10115'
      },
      items: [
        { productId: 'prod-1', quantity: 3, weight: 2.0 }
      ],
      subtotal: 120.00,
      weight: 6.0
    });
    console.log('   Available rates:', rates3.rates.length);
    rates3.rates.forEach(rate => {
      console.log(`   - ${rate.name}: $${rate.cost} (${rate.estimatedDays.min}-${rate.estimatedDays.max} days)`);
    });

  } catch (error) {
    console.error('❌ Error testing shipping calculation:', error);
  }
}

async function testShipmentWorkflow(setupData) {
  console.log('\n📦 Testing Shipment Workflow...\n');

  try {
    // 1. Find optimal fulfillment center
    console.log('1. Finding optimal fulfillment center...');
    const optimalCenter = await apiCall('/fulfillment-centers/find-optimal', 'POST', {
      shippingAddress: {
        country: 'US',
        state: 'CA',
        city: 'San Francisco',
        postalCode: '94105'
      },
      items: [
        { productId: 'prod-1', quantity: 2 }
      ],
      requiresShipping: true
    });
    console.log(`   ✅ Optimal center: ${optimalCenter.center.name} (${optimalCenter.recommendationReason})`);

    // 2. Create a shipment
    console.log('\n2. Creating shipment...');
    const shipment = await apiCall('/shipments', 'POST', {
      orderId: 'demo-order-123',
      fulfillmentCenterId: optimalCenter.center.id,
      shippingProviderId: setupData.providers.ups.id,
      shippingRateId: setupData.rates.standard.id,
      fromAddress: {
        name: optimalCenter.center.name,
        address1: optimalCenter.center.address1,
        city: optimalCenter.center.city,
        state: optimalCenter.center.state,
        country: optimalCenter.center.country,
        postalCode: optimalCenter.center.postalCode
      },
      toAddress: {
        name: 'John Doe',
        address1: '789 Customer Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        postalCode: '94105',
        phone: '+1-555-0789'
      },
      packages: [
        {
          id: 'pkg-1',
          length: 12,
          width: 8,
          height: 6,
          weight: 2.5,
          units: 'IMPERIAL',
          items: [
            {
              productId: 'prod-1',
              quantity: 2,
              description: 'Wireless Headphones'
            }
          ]
        }
      ],
      shippingCost: 9.99,
      serviceType: 'GROUND'
    });
    console.log(`   ✅ Created shipment: ${shipment.id}`);

    // 3. Generate shipping label
    console.log('\n3. Generating shipping label...');
    const label = await apiCall(`/shipments/${shipment.id}/generate-label`, 'POST', {
      format: 'PDF'
    });
    console.log(`   ✅ Label generated: ${label.labelUrl}`);

    // 4. Update shipment status
    console.log('\n4. Updating shipment status...');
    const statusUpdate = await apiCall(`/shipments/${shipment.id}/status`, 'PATCH', {
      status: 'SHIPPED',
      trackingEvents: [
        {
          status: 'SHIPPED',
          description: 'Package shipped from fulfillment center',
          location: 'Los Angeles, CA',
          timestamp: new Date()
        }
      ]
    });
    console.log(`   ✅ Status updated to: ${statusUpdate.status}`);

    // 5. Track shipment
    console.log('\n5. Tracking shipment...');
    const tracking = await apiCall(`/shipments/${shipment.id}/track`);
    console.log(`   ✅ Tracking info retrieved for: ${tracking.shipment.trackingNumber}`);
    console.log(`   📍 Current status: ${tracking.shipment.status}`);
    console.log(`   📅 Estimated delivery: ${tracking.shipment.estimatedDeliveryDate || 'TBD'}`);

    return shipment;

  } catch (error) {
    console.error('❌ Error testing shipment workflow:', error);
  }
}

async function testProviderIntegration(setupData) {
  console.log('\n🔌 Testing Provider Integration...\n');

  try {
    // 1. Test UPS connection
    console.log('1. Testing UPS connection...');
    const upsTest = await apiCall(`/shipping-providers/${setupData.providers.ups.id}/test-connection`, 'POST');
    console.log(`   ${upsTest.success ? '✅' : '❌'} UPS: ${upsTest.message}`);

    // 2. Test FedEx connection
    console.log('\n2. Testing FedEx connection...');
    const fedexTest = await apiCall(`/shipping-providers/${setupData.providers.fedex.id}/test-connection`, 'POST');
    console.log(`   ${fedexTest.success ? '✅' : '❌'} FedEx: ${fedexTest.message}`);

    // 3. Get real-time rates from UPS
    console.log('\n3. Getting real-time rates from UPS...');
    const upsRates = await apiCall(`/shipping-providers/${setupData.providers.ups.id}/get-rates`, 'POST', {
      fromAddress: {
        address1: '123 Warehouse Street',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        postalCode: '90210'
      },
      toAddress: {
        address1: '789 Customer Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        postalCode: '94105'
      },
      packages: [
        {
          length: 12,
          width: 8,
          height: 6,
          weight: 2.5,
          units: 'IMPERIAL'
        }
      ]
    });
    console.log('   ✅ UPS real-time rates:');
    upsRates.rates.forEach(rate => {
      console.log(`   - ${rate.serviceName}: $${rate.cost} (delivery: ${rate.deliveryDate})`);
    });

  } catch (error) {
    console.error('❌ Error testing provider integration:', error);
  }
}

async function runFullDemo() {
  console.log('🚀 Starting Complete Shipping & Fulfillment Demo');
  console.log('================================================');

  try {
    // Setup phase
    const setupData = await setupShippingDemo();
    
    // Testing phase
    await testShippingCalculation();
    await testShipmentWorkflow(setupData);
    await testProviderIntegration(setupData);

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('• ✅ Shipping zones and geographic coverage');
    console.log('• ✅ Multiple shipping rate calculation methods');
    console.log('• ✅ Multi-location fulfillment centers');
    console.log('• ✅ Shipping provider integration');
    console.log('• ✅ Complete shipment lifecycle');
    console.log('• ✅ Real-time rate calculation');
    console.log('• ✅ Shipping label generation');
    console.log('• ✅ Shipment tracking');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
  }
}

// Run the demo if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runFullDemo();
} else {
  // Browser environment
  console.log('To run this demo, call runFullDemo() in the browser console');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runFullDemo,
    setupShippingDemo,
    testShippingCalculation,
    testShipmentWorkflow,
    testProviderIntegration
  };
}
