# Tax Region Management System

This comprehensive tax region management system allows you to handle complex tax calculations across multiple geographical regions with support for hierarchical tax structures, product-specific overrides, and automated tax calculation.

## Overview

The tax region system consists of:
- **Tax Regions**: Geographical areas with specific tax rates (countries, states, provinces)
- **Tax Rate Overrides**: Product or product-type specific tax rates that override defaults
- **Hierarchical Structure**: Support for parent-child relationships (country -> state/province)
- **Tax Calculation Service**: Automated tax calculation for orders and products

## Entities

### TaxRegion Entity

Located in `src/entities/TaxRegion.ts`, this entity manages tax regions with the following key features:

**Core Properties:**
- `name`: Human-readable name of the tax region
- `countryCode`: ISO 3166-1 alpha-2 country code (e.g., "US", "CA")
- `subdivisionCode`: ISO 3166-2 subdivision code (e.g., "US-CA", "CA-ON")
- `status`: Active or inactive status
- `parentRegionId`: For creating hierarchical tax structures
- `isDefault`: Whether this is the default region for a country
- `sublevelEnabled`: Whether this region supports subregions

**Tax Configuration:**
- `defaultTaxRate`: Base tax rate as decimal (e.g., 0.08 for 8%)
- `defaultTaxRateName`: Display name for the tax rate
- `defaultTaxCode`: Tax code for reporting/compliance
- `defaultCombinableWithParent`: Whether to combine with parent region rates

**Tax Overrides:**
- `taxOverrides`: Array of product/product-type specific tax rates

## API Endpoints

### Basic CRUD Operations

#### Get All Tax Regions
```http
GET /api/tax-regions
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `status`: Filter by status (active/inactive)
- `countryCode`: Filter by country
- `parentRegionId`: Filter by parent region
- `search`: Search in name, country, or subdivision codes
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

#### Get Tax Region by ID
```http
GET /api/tax-regions/:id
```

Returns the tax region with its subregions if sublevel is enabled.

#### Create Tax Region
```http
POST /api/tax-regions
```

**Request Body:**
```json
{
  "name": "California",
  "countryCode": "US",
  "subdivisionCode": "US-CA",
  "status": "active",
  "parentRegionId": "us-region-id",
  "defaultTaxRateName": "California State Tax",
  "defaultTaxRate": 0.075,
  "defaultTaxCode": "CA-STATE",
  "defaultCombinableWithParent": true
}
```

#### Update Tax Region
```http
PUT /api/tax-regions/:id
```

#### Delete Tax Region
```http
DELETE /api/tax-regions/:id
```

### Tax Override Management

#### Create Tax Rate Override
```http
POST /api/tax-regions/:id/overrides
```

**Request Body:**
```json
{
  "name": "Luxury Goods Tax",
  "rate": 0.10,
  "code": "LUXURY",
  "combinable": true,
  "targets": [
    {
      "type": "product_type",
      "targetId": "luxury_goods"
    }
  ]
}
```

#### Update Tax Rate Override
```http
PUT /api/tax-regions/:id/overrides/:overrideId
```

#### Delete Tax Rate Override
```http
DELETE /api/tax-regions/:id/overrides/:overrideId
```

### Subregion Management

#### Get Subregions
```http
GET /api/tax-regions/:id/subregions
```

#### Enable Sublevels
```http
POST /api/tax-regions/:id/enable-sublevels
```

### Tax Calculation

#### Calculate Tax for Product
```http
POST /api/tax-regions/:id/calculate
```

**Request Body:**
```json
{
  "productId": "product-123",
  "productType": "luxury_goods",
  "amount": 1000
}
```

**Response:**
```json
{
  "regionId": "region-123",
  "regionName": "California",
  "amount": 1000,
  "taxRate": 0.175,
  "taxRatePercentage": 17.5,
  "taxAmount": 175,
  "totalAmount": 1175
}
```

## Tax Calculation Service

The `TaxCalculationService` in `src/utils/taxCalculation.ts` provides programmatic tax calculation capabilities.

### Basic Usage

```typescript
import { TaxCalculationService } from '../utils/taxCalculation';

const taxService = new TaxCalculationService();

// Calculate tax for a specific address
const taxResult = await taxService.calculateTax({
  countryCode: 'US',
  subdivisionCode: 'US-CA',
  productId: 'product-123',
  productType: 'luxury_goods',
  amount: 1000,
  shippingAddress: {
    country: 'US',
    state: 'CA',
    city: 'Los Angeles',
    postalCode: '90210'
  }
});
```

### Methods

#### `calculateTax(request: TaxCalculationRequest)`
Calculates tax based on shipping address and product details.

#### `calculateTaxForRegion(taxRegion, productId, productType, amount)`
Calculates tax for a specific region.

#### `getTaxRegionsForCountry(countryCode)`
Gets all active tax regions for a country.

#### `getDefaultTaxRegion(countryCode)`
Gets the default tax region for a country.

## Common Scenarios

### 1. Setting Up US Tax Regions

```javascript
// Create US parent region
const usRegion = await makeRequest('POST', '/api/tax-regions', {
  name: "United States",
  countryCode: "US",
  status: "active",
  isDefault: true,
  sublevelEnabled: true,
  defaultTaxRate: 0.00, // No federal sales tax
  defaultTaxCode: "US-FEDERAL"
});

// Create California subregion
const californiaRegion = await makeRequest('POST', '/api/tax-regions', {
  name: "California",
  countryCode: "US",
  subdivisionCode: "US-CA",
  parentRegionId: usRegion.taxRegion.id,
  status: "active",
  defaultTaxRateName: "California State Tax",
  defaultTaxRate: 0.075, // 7.5%
  defaultTaxCode: "CA-STATE",
  defaultCombinableWithParent: true
});
```

### 2. Setting Up Canadian HST/GST

```javascript
// Create Canada parent region with GST
const canadaRegion = await makeRequest('POST', '/api/tax-regions', {
  name: "Canada",
  countryCode: "CA",
  status: "active",
  isDefault: true,
  sublevelEnabled: true,
  defaultTaxRateName: "GST",
  defaultTaxRate: 0.05, // 5% GST
  defaultTaxCode: "CA-GST"
});

// Create Ontario with additional provincial tax (HST)
const ontarioRegion = await makeRequest('POST', '/api/tax-regions', {
  name: "Ontario",
  countryCode: "CA",
  subdivisionCode: "CA-ON",
  parentRegionId: canadaRegion.taxRegion.id,
  status: "active",
  defaultTaxRateName: "Ontario HST",
  defaultTaxRate: 0.08, // Additional 8% (total 13% HST)
  defaultTaxCode: "ON-HST",
  defaultCombinableWithParent: true
});
```

### 3. Product-Specific Tax Overrides

```javascript
// Add luxury tax override
await makeRequest('POST', `/api/tax-regions/${regionId}/overrides`, {
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
});

// Add digital products tax (replaces default)
await makeRequest('POST', `/api/tax-regions/${regionId}/overrides`, {
  name: "Digital Products Tax",
  rate: 0.05, // Flat 5%
  code: "DIGITAL",
  combinable: false, // Replaces default rate
  targets: [
    {
      type: "product_type",
      targetId: "digital"
    }
  ]
});
```

### 4. Order Tax Calculation

```javascript
// Calculate tax for an order
const orderTax = await taxService.calculateTax({
  countryCode: 'US',
  subdivisionCode: 'US-CA',
  amount: orderSubtotal,
  shippingAddress: order.shippingAddress
});

// Update order with tax information
order.taxAmount = orderTax.taxAmount;
order.taxRegionId = orderTax.regionId;
order.taxBreakdown = orderTax.breakdown;
order.total = order.subtotal + order.taxAmount + order.shippingAmount;
```

## Integration with Orders

The Order entity has been enhanced with tax-related fields:

- `taxRegionId`: ID of the tax region used
- `taxBreakdown`: Detailed breakdown of tax calculations
- `taxExempt`: Whether the order is tax exempt
- `taxExemptReason`: Reason for exemption

## Testing

Use the provided test file `test-tax-regions.js` to test the tax region system:

```bash
node test-tax-regions.js
```

This will:
1. Create sample tax regions for US and Canada
2. Create subregions (California, Ontario)
3. Add tax overrides for different product types
4. Test tax calculations
5. Verify filtering and search functionality

## Best Practices

### 1. Tax Region Hierarchy
- Always create country-level regions first
- Enable sublevels only for countries that need state/province taxes
- Use proper ISO codes for consistency

### 2. Tax Rate Management
- Store rates as decimals (0.08 for 8%)
- Use descriptive names and codes for reporting
- Consider whether rates should combine with parent regions

### 3. Product-Specific Taxes
- Use product types for broad categories
- Use specific product IDs for individual items
- Consider whether overrides should combine with or replace default rates

### 4. Compliance
- Keep detailed tax breakdowns for audit trails
- Use proper tax codes for reporting
- Consider tax exemption scenarios

### 5. Performance
- Cache frequently used tax regions
- Index by country code and subdivision code
- Consider tax calculation caching for identical scenarios

## Error Handling

The system includes comprehensive error handling:
- Validation for ISO country codes
- Prevention of duplicate default regions
- Checks for orphaned subregions on deletion
- Proper error messages for client applications

## Future Enhancements

Potential improvements to consider:
- Tax holiday support (temporary rate changes)
- Time-based tax rates (effective dates)
- Integration with external tax services (Avalara, TaxJar)
- Automatic tax rate updates
- Multi-currency tax calculations
- Tax reporting and analytics dashboard
