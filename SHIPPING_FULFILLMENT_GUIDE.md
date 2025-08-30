# Shipping & Fulfillment System

This document describes the comprehensive shipping and fulfillment system implemented in the headless e-commerce platform.

## Overview

The shipping system provides:
- **Shipping Zones**: Geographic-based shipping configuration
- **Shipping Rates**: Multiple rate calculation methods
- **Shipping Providers**: Integration with UPS, FedEx, DHL, etc.
- **Fulfillment Centers**: Multi-location inventory management
- **Shipments**: End-to-end shipment tracking
- **Real-time Rate Calculation**: Dynamic shipping cost calculation

## Entities

### ShippingZone
Defines geographic regions for shipping configuration.

**Fields:**
- `name`: Zone name (e.g., "North America", "EU")
- `countries`: Array of country codes (["US", "CA", "MX"])
- `states`: Array of state/province codes
- `cities`: Array of specific cities (optional)
- `postalCodes`: Array of postal code patterns
- `priority`: Zone matching priority

### ShippingRate
Defines shipping rate calculation methods.

**Rate Types:**
- `FLAT_RATE`: Fixed shipping cost
- `WEIGHT_BASED`: Rate based on package weight
- `PRICE_BASED`: Percentage of order total
- `FREE`: Free shipping with conditions
- `CALCULATED`: Real-time rates from providers

**Fields:**
- `shippingZoneId`: Associated shipping zone
- `shippingProviderId`: Associated provider
- `flatRate`: Fixed rate amount
- `weightRate`: Rate per weight unit
- `priceRate`: Percentage of order total
- `freeShippingThreshold`: Minimum order for free shipping
- `minDeliveryDays/maxDeliveryDays`: Delivery estimates

### ShippingProvider
Configuration for shipping providers (UPS, FedEx, DHL, etc.).

**Fields:**
- `type`: Provider type (UPS, FEDEX, DHL, USPS, CUSTOM)
- `apiEndpoint`: Provider API URL
- `apiKey/apiSecret`: Authentication credentials
- `accountNumber`: Provider account number
- `supportedServices`: Available shipping services
- `isTestMode`: Development/production mode

#### Security & Key Management
- API credentials are encrypted at rest using AES-256 with a server-side key stored in the `SHIPPING_ENCRYPTION_KEY` environment variable.
- Keep the key in a dedicated secrets manager or secure environment variable with restricted access.
- Rotate encryption keys periodically by generating a new key, decrypting existing credentials with the old key, re-encrypting with the new key, and removing the old key from all systems.
- Avoid exposing decrypted credentials in logs or API responses.

### FulfillmentCenter
Physical locations for inventory and order fulfillment.

**Fields:**
- `name`: Center name
- `code`: Unique identifier
- `address`: Full address information
- `operatingHours`: Business hours
- `canShip/canReceive/canProcess`: Capabilities
- `supportedShippingZones`: Covered zones
- `priority`: Order routing priority
- `latitude/longitude`: GPS coordinates

### Shipment
Individual shipment tracking and management.

**Fields:**
- `orderId`: Associated order
- `fulfillmentCenterId`: Origin center
- `shippingProviderId`: Shipping provider
- `trackingNumber`: Provider tracking number
- `status`: Current shipment status
- `fromAddress/toAddress`: Shipping addresses
- `packages`: Package details and items
- `shippingCost`: Total shipping cost
- `trackingEvents`: Status update history

## API Endpoints

### Shipping Zones

```
GET    /api/shipping-zones              # List all zones
GET    /api/shipping-zones/:id          # Get zone by ID
POST   /api/shipping-zones              # Create new zone
PUT    /api/shipping-zones/:id          # Update zone
DELETE /api/shipping-zones/:id          # Delete zone
POST   /api/shipping-zones/check-coverage # Check address coverage
```

### Shipping Rates

```
GET    /api/shipping-rates              # List all rates
GET    /api/shipping-rates/:id          # Get rate by ID
POST   /api/shipping-rates              # Create new rate
PUT    /api/shipping-rates/:id          # Update rate
DELETE /api/shipping-rates/:id          # Delete rate
POST   /api/shipping-rates/calculate    # Calculate shipping for order
```

### Fulfillment Centers

```
GET    /api/fulfillment-centers         # List all centers
GET    /api/fulfillment-centers/:id     # Get center by ID
POST   /api/fulfillment-centers         # Create new center
PUT    /api/fulfillment-centers/:id     # Update center
DELETE /api/fulfillment-centers/:id     # Delete center
POST   /api/fulfillment-centers/find-optimal # Find best center for order
GET    /api/fulfillment-centers/:id/inventory # Get center inventory
```

### Shipping Providers

```
GET    /api/shipping-providers          # List all providers
GET    /api/shipping-providers/:id      # Get provider by ID
POST   /api/shipping-providers          # Create new provider
PUT    /api/shipping-providers/:id      # Update provider
DELETE /api/shipping-providers/:id      # Delete provider
POST   /api/shipping-providers/:id/test-connection # Test API connection
POST   /api/shipping-providers/:id/get-rates # Get real-time rates
```

### Shipments

```
GET    /api/shipments                   # List all shipments
GET    /api/shipments/:id               # Get shipment by ID
POST   /api/shipments                   # Create new shipment
PUT    /api/shipments/:id               # Update shipment
PATCH  /api/shipments/:id/status        # Update shipment status
GET    /api/shipments/:id/track         # Track shipment
POST   /api/shipments/:id/generate-label # Generate shipping label
POST   /api/shipments/:id/cancel        # Cancel shipment
```

## Usage Examples

### 1. Setting Up Shipping Zones

```javascript
// Create a North America shipping zone
POST /api/shipping-zones
{
  "name": "North America",
  "description": "US, Canada, and Mexico",
  "countries": ["US", "CA", "MX"],
  "states": [],
  "cities": [],
  "postalCodes": ["*"],
  "isActive": true,
  "priority": 1
}
```

### 2. Creating Shipping Rates

```javascript
// Flat rate shipping
POST /api/shipping-rates
{
  "name": "Standard Shipping",
  "shippingZoneId": "zone-id",
  "type": "FLAT_RATE",
  "flatRate": 9.99,
  "freeShippingThreshold": 50.00,
  "minDeliveryDays": 3,
  "maxDeliveryDays": 7
}

// Weight-based shipping
POST /api/shipping-rates
{
  "name": "Weight-Based Shipping",
  "shippingZoneId": "zone-id",
  "type": "WEIGHT_BASED",
  "weightRate": 2.50,
  "minWeight": 0.1,
  "maxWeight": 50.0
}
```

### 3. Calculating Shipping Rates

```javascript
POST /api/shipping-rates/calculate
{
  "shippingAddress": {
    "country": "US",
    "state": "CA",
    "city": "Los Angeles",
    "postalCode": "90210"
  },
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "weight": 1.5
    }
  ],
  "subtotal": 75.00,
  "weight": 3.0
}

// Response
{
  "rates": [
    {
      "id": "rate-1",
      "name": "Standard Shipping",
      "cost": 0, // Free shipping (subtotal > $50)
      "estimatedDays": { "min": 3, "max": 7 },
      "type": "FLAT_RATE"
    },
    {
      "id": "rate-2",
      "name": "Express Shipping",
      "cost": 19.99,
      "estimatedDays": { "min": 1, "max": 2 },
      "type": "FLAT_RATE"
    }
  ]
}
```

### 4. Setting Up Fulfillment Centers

```javascript
POST /api/fulfillment-centers
{
  "name": "West Coast Warehouse",
  "code": "WCW-001",
  "address1": "123 Warehouse St",
  "city": "Los Angeles",
  "state": "CA",
  "country": "US",
  "postalCode": "90210",
  "canShip": true,
  "canReceive": true,
  "isDefault": true,
  "supportedShippingZones": ["zone-north-america"],
  "operatingHours": {
    "monday": { "open": "08:00", "close": "17:00" },
    "tuesday": { "open": "08:00", "close": "17:00" },
    "wednesday": { "open": "08:00", "close": "17:00" },
    "thursday": { "open": "08:00", "close": "17:00" },
    "friday": { "open": "08:00", "close": "17:00" }
  }
}
```

### 5. Creating Shipments

```javascript
POST /api/shipments
{
  "orderId": "order-123",
  "fulfillmentCenterId": "fc-1",
  "shippingProviderId": "provider-ups",
  "shippingRateId": "rate-1",
  "fromAddress": {
    "name": "West Coast Warehouse",
    "address1": "123 Warehouse St",
    "city": "Los Angeles",
    "state": "CA",
    "country": "US",
    "postalCode": "90210"
  },
  "toAddress": {
    "name": "John Doe",
    "address1": "456 Customer Ave",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postalCode": "10001"
  },
  "packages": [
    {
      "id": "pkg-1",
      "length": 12,
      "width": 8,
      "height": 6,
      "weight": 2.5,
      "units": "IMPERIAL",
      "items": [
        {
          "productId": "prod-1",
          "quantity": 1,
          "description": "Wireless Headphones"
        }
      ]
    }
  ],
  "shippingCost": 9.99
}
```

## Integration Features

### Real-time Rate Calculation
- Integration with UPS, FedEx, DHL APIs
- Dynamic rate calculation based on real-time data
- Support for multiple shipping services per provider

### Label Generation
- Automatic shipping label generation
- Support for PDF, PNG, ZPL formats
- Batch label printing capabilities

### Tracking Integration
- Real-time tracking updates from providers
- Automatic status synchronization
- Customer notification triggers

### Multi-location Fulfillment
- Intelligent order routing to optimal centers
- Inventory allocation across locations
- Split shipment support

## Advanced Features

### Zone Priority System
Shipping zones are evaluated by priority, allowing overlapping zones with different rates.

### Free Shipping Conditions
Multiple ways to trigger free shipping:
- Order total threshold
- Customer group benefits
- Promotional campaigns
- Product-specific rules

### Delivery Time Estimates
Accurate delivery estimates based on:
- Provider service levels
- Geographic distance
- Historical delivery data
- Business day calculations

### Cost Optimization
- Automatic provider selection for best rates
- Zone-based rate comparison
- Weight/dimension optimization

## Security Considerations

### API Key Protection
- Sensitive provider credentials are masked in responses
- Secure storage of API keys and secrets
- Environment-based configuration

### Data Privacy
- Address information encryption
- Customer data protection
- GDPR compliance ready

## Future Enhancements

### Planned Features
- International customs documentation
- Hazardous materials handling
- Dimensional weight calculations
- Insurance options
- Signature requirements
- Saturday/holiday delivery options

### Integration Roadmap
- Additional carrier support (USPS, Canada Post, etc.)
- Drop-shipping provider integration
- Third-party logistics (3PL) support
- Warehouse management system (WMS) integration

This shipping system provides a comprehensive foundation for e-commerce fulfillment with room for extensive customization and scaling.
