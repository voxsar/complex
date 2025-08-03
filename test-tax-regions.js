const baseURL = 'http://localhost:3000/api';

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  const config = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} failed:`, error.message);
    throw error;
  }
}

// Test data for tax regions
const testData = {
  // US Federal tax region
  usTaxRegion: {
    name: "United States",
    countryCode: "US",
    status: "active",
    isDefault: true,
    sublevelEnabled: true,
    defaultTaxRateName: "Federal Sales Tax",
    defaultTaxRate: 0.00, // No federal sales tax in US
    defaultTaxCode: "US-FEDERAL"
  },
  
  // California state tax
  californiaTaxRegion: {
    name: "California",
    countryCode: "US",
    subdivisionCode: "US-CA",
    status: "active",
    defaultTaxRateName: "California State Tax",
    defaultTaxRate: 0.075, // 7.5%
    defaultTaxCode: "CA-STATE",
    defaultCombinableWithParent: true
  },
  
  // Canada federal tax
  canadaTaxRegion: {
    name: "Canada",
    countryCode: "CA",
    status: "active",
    isDefault: true,
    sublevelEnabled: true,
    defaultTaxRateName: "GST",
    defaultTaxRate: 0.05, // 5% GST
    defaultTaxCode: "CA-GST"
  },
  
  // Ontario provincial tax
  ontarioTaxRegion: {
    name: "Ontario",
    countryCode: "CA",
    subdivisionCode: "CA-ON",
    status: "active",
    defaultTaxRateName: "Ontario HST",
    defaultTaxRate: 0.08, // 8% additional (total 13% HST)
    defaultTaxCode: "ON-HST",
    defaultCombinableWithParent: true
  },
  
  // Tax override for luxury items
  luxuryTaxOverride: {
    name: "Luxury Goods Tax",
    rate: 0.10, // Additional 10%
    code: "LUXURY",
    combinable: true,
    targets: [
      {
        type: "product_type",
        targetId: "luxury_goods"
      }
    ]
  },
  
  // Tax override for digital products
  digitalTaxOverride: {
    name: "Digital Products Tax",
    rate: 0.05, // 5% flat rate
    code: "DIGITAL",
    combinable: false, // Replaces default rate
    targets: [
      {
        type: "product_type",
        targetId: "digital"
      }
    ]
  }
};

async function runTaxRegionTests() {
  console.log("🧪 Starting Tax Region Management Tests");
  console.log("=====================================");
  
  try {
    // 1. Create US tax region
    console.log("\n1️⃣ Creating US tax region...");
    const usRegion = await makeRequest('POST', '/tax-regions', testData.usTaxRegion);
    console.log("✅ US tax region created:", usRegion.taxRegion.name);
    
    // 2. Create California subregion
    console.log("\n2️⃣ Creating California subregion...");
    const californiaData = {
      ...testData.californiaTaxRegion,
      parentRegionId: usRegion.taxRegion.id
    };
    const californiaRegion = await makeRequest('POST', '/tax-regions', californiaData);
    console.log("✅ California tax region created:", californiaRegion.taxRegion.name);
    
    // 3. Create Canada tax region
    console.log("\n3️⃣ Creating Canada tax region...");
    const canadaRegion = await makeRequest('POST', '/tax-regions', testData.canadaTaxRegion);
    console.log("✅ Canada tax region created:", canadaRegion.taxRegion.name);
    
    // 4. Create Ontario subregion
    console.log("\n4️⃣ Creating Ontario subregion...");
    const ontarioData = {
      ...testData.ontarioTaxRegion,
      parentRegionId: canadaRegion.taxRegion.id
    };
    const ontarioRegion = await makeRequest('POST', '/tax-regions', ontarioData);
    console.log("✅ Ontario tax region created:", ontarioRegion.taxRegion.name);
    
    // 5. Add tax overrides to California
    console.log("\n5️⃣ Adding luxury tax override to California...");
    const luxuryOverride = await makeRequest(
      'POST', 
      `/tax-regions/${californiaRegion.taxRegion._id}/overrides`,
      testData.luxuryTaxOverride
    );
    console.log("✅ Luxury tax override added");
    
    console.log("\n6️⃣ Adding digital tax override to California...");
    const digitalOverride = await makeRequest(
      'POST', 
      `/tax-regions/${californiaRegion.taxRegion._id}/overrides`,
      testData.digitalTaxOverride
    );
    console.log("✅ Digital tax override added");
    
    // 7. Test tax calculations
    console.log("\n7️⃣ Testing tax calculations...");
    
    // Regular product in California (should use state + federal rates)
    const regularTax = await makeRequest(
      'POST',
      `/tax-regions/${californiaRegion.taxRegion._id}/calculate`,
      {
        productId: "regular-product-123",
        productType: "physical",
        amount: 100
      }
    );
    console.log("📊 Regular product tax in CA:", {
      amount: regularTax.amount,
      taxRate: `${regularTax.taxRatePercentage}%`,
      taxAmount: regularTax.taxAmount,
      total: regularTax.totalAmount
    });
    
    // Luxury product in California (should include luxury override)
    const luxuryTax = await makeRequest(
      'POST',
      `/tax-regions/${californiaRegion.taxRegion._id}/calculate`,
      {
        productId: "luxury-product-456",
        productType: "luxury_goods",
        amount: 1000
      }
    );
    console.log("💎 Luxury product tax in CA:", {
      amount: luxuryTax.amount,
      taxRate: `${luxuryTax.taxRatePercentage}%`,
      taxAmount: luxuryTax.taxAmount,
      total: luxuryTax.totalAmount
    });
    
    // Digital product in California (should use override rate only)
    const digitalTax = await makeRequest(
      'POST',
      `/tax-regions/${californiaRegion.taxRegion._id}/calculate`,
      {
        productId: "digital-product-789",
        productType: "digital",
        amount: 50
      }
    );
    console.log("💻 Digital product tax in CA:", {
      amount: digitalTax.amount,
      taxRate: `${digitalTax.taxRatePercentage}%`,
      taxAmount: digitalTax.taxAmount,
      total: digitalTax.totalAmount
    });
    
    // 8. Get all tax regions
    console.log("\n8️⃣ Fetching all tax regions...");
    const allRegions = await makeRequest('GET', '/tax-regions');
    console.log(`📋 Total tax regions: ${allRegions.taxRegions.length}`);
    
    // 9. Get subregions for US
    console.log("\n9️⃣ Fetching US subregions...");
    const usSubregions = await makeRequest('GET', `/tax-regions/${usRegion.taxRegion._id}/subregions`);
    console.log(`🏛️ US subregions: ${usSubregions.subregions.length}`);
    
    // 10. Update a tax region
    console.log("\n🔟 Updating California tax rate...");
    const updatedCalifornia = await makeRequest(
      'PUT',
      `/tax-regions/${californiaRegion.taxRegion._id}`,
      {
        defaultTaxRate: 0.08 // Increase to 8%
      }
    );
    console.log("✅ California tax rate updated to 8%");
    
    // 11. Test filtering by country
    console.log("\n1️⃣1️⃣ Filtering tax regions by country...");
    const usRegions = await makeRequest('GET', '/tax-regions?countryCode=US');
    console.log(`🇺🇸 US tax regions: ${usRegions.taxRegions.length}`);
    
    const canadaRegions = await makeRequest('GET', '/tax-regions?countryCode=CA');
    console.log(`🇨🇦 Canada tax regions: ${canadaRegions.taxRegions.length}`);
    
    // 12. Test search functionality
    console.log("\n1️⃣2️⃣ Testing search functionality...");
    const searchResults = await makeRequest('GET', '/tax-regions?search=California');
    console.log(`🔍 Search for 'California': ${searchResults.taxRegions.length} results`);
    
    console.log("\n🎉 All tax region tests completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- Created US and Canada parent regions");
    console.log("- Created California and Ontario subregions");
    console.log("- Added luxury and digital tax overrides");
    console.log("- Tested tax calculations for different product types");
    console.log("- Verified filtering, search, and subregion functionality");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

// Additional utility functions for tax region management

async function createTaxRegionFromAddress(address, taxRate = 0.08) {
  console.log(`\n🏠 Creating tax region for address: ${address.city}, ${address.state}, ${address.country}`);
  
  try {
    // Check if country region exists
    let countryRegion;
    try {
      const existingCountry = await makeRequest('GET', `/tax-regions?countryCode=${address.country}&parentRegionId=null`);
      if (existingCountry.taxRegions.length > 0) {
        countryRegion = existingCountry.taxRegions[0];
        console.log(`✅ Found existing country region: ${countryRegion.name}`);
      }
    } catch (error) {
      // Country region doesn't exist, create it
      countryRegion = await makeRequest('POST', '/tax-regions', {
        name: address.country === 'US' ? 'United States' : address.country,
        countryCode: address.country,
        status: 'active',
        isDefault: true,
        sublevelEnabled: true,
        defaultTaxRate: 0,
        defaultTaxCode: `${address.country}-DEFAULT`
      });
      console.log(`✅ Created country region: ${countryRegion.taxRegion.name}`);
      countryRegion = countryRegion.taxRegion;
    }
    
    // Create state/province region if it doesn't exist
    const subdivisionCode = `${address.country}-${address.state}`;
    const stateRegion = await makeRequest('POST', '/tax-regions', {
      name: address.state,
      countryCode: address.country,
      subdivisionCode,
      parentRegionId: countryRegion.id,
      status: 'active',
      defaultTaxRateName: `${address.state} Tax`,
      defaultTaxRate: taxRate,
      defaultTaxCode: `${address.state}-TAX`,
      defaultCombinableWithParent: true
    });
    
    console.log(`✅ Created state region: ${stateRegion.taxRegion.name} with ${taxRate * 100}% tax rate`);
    return stateRegion.taxRegion;
    
  } catch (error) {
    console.error(`❌ Failed to create tax region for address:`, error.message);
    throw error;
  }
}

async function calculateTaxForOrder(orderData) {
  console.log(`\n💰 Calculating tax for order with shipping to: ${orderData.shippingAddress.state}, ${orderData.shippingAddress.country}`);
  
  try {
    // Find applicable tax region
    const subdivisionCode = `${orderData.shippingAddress.country}-${orderData.shippingAddress.state}`;
    const regions = await makeRequest('GET', `/tax-regions?countryCode=${orderData.shippingAddress.country}&subdivisionCode=${subdivisionCode}`);
    
    if (regions.taxRegions.length === 0) {
      console.log("⚠️ No tax region found for this address");
      return { taxAmount: 0, taxRate: 0 };
    }
    
    const taxRegion = regions.taxRegions[0];
    let totalTax = 0;
    
    // Calculate tax for each item
    for (const item of orderData.items) {
      const itemTax = await makeRequest(
        'POST',
        `/tax-regions/${taxRegion._id}/calculate`,
        {
          productId: item.productId,
          productType: item.productType,
          amount: item.price * item.quantity
        }
      );
      
      totalTax += itemTax.taxAmount;
      console.log(`📦 Item ${item.productId}: $${itemTax.taxAmount.toFixed(2)} tax (${itemTax.taxRatePercentage}%)`);
    }
    
    console.log(`💵 Total tax for order: $${totalTax.toFixed(2)}`);
    return { taxAmount: totalTax, taxRegionId: taxRegion.id };
    
  } catch (error) {
    console.error("❌ Tax calculation failed:", error.message);
    throw error;
  }
}

// Example usage
const exampleOrder = {
  shippingAddress: {
    country: "US",
    state: "CA",
    city: "Los Angeles",
    postalCode: "90210"
  },
  items: [
    {
      productId: "product-1",
      productType: "physical",
      price: 100,
      quantity: 2
    },
    {
      productId: "product-2",
      productType: "luxury_goods",
      price: 500,
      quantity: 1
    },
    {
      productId: "product-3",
      productType: "digital",
      price: 25,
      quantity: 3
    }
  ]
};

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTaxRegionTests,
    createTaxRegionFromAddress,
    calculateTaxForOrder,
    makeRequest
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTaxRegionTests()
    .then(() => {
      console.log("\n🧪 Running additional tax calculation example...");
      return calculateTaxForOrder(exampleOrder);
    })
    .then(() => {
      console.log("\n✅ All tests and examples completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Tests failed:", error);
      process.exit(1);
    });
}
