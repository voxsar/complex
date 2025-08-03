# Order Management System API Documentation

This document outlines the comprehensive order management system with support for payments, fulfillments, returns, claims, exchanges, price lists, and sales channels.

## Table of Contents

1. [Order Management](#order-management)
2. [Payment Management](#payment-management)
3. [Fulfillment Management](#fulfillment-management)
4. [Returns Management](#returns-management)
5. [Claims Management](#claims-management)
6. [Exchanges Management](#exchanges-management)
7. [Price Lists](#price-lists)
8. [Sales Channels](#sales-channels)
9. [Multi-Currency Support](#multi-currency-support)

## Order Management

### Enhanced Order Entity Features

- **Payment Tracking**: Multiple payments per order with status tracking
- **Fulfillment Management**: Track shipping and delivery status
- **Returns/Claims/Exchanges**: Reference IDs for post-order processes
- **Sales Channel Association**: Track which channel the order came from
- **Price List Integration**: Support for custom pricing

### New Order Endpoints

#### Add Payment to Order
```http
POST /api/orders/:id/payments
```
**Body:**
```json
{
  "amount": 100.00,
  "currency": "USD",
  "method": "credit_card",
  "reference": "payment_ref_123",
  "gatewayTransactionId": "txn_abc123",
  "gatewayResponse": {}
}
```

#### Update Payment Status
```http
PATCH /api/orders/:id/payments/:paymentId
```
**Body:**
```json
{
  "status": "paid",
  "gatewayResponse": {},
  "failureReason": null
}
```

#### Add Fulfillment
```http
POST /api/orders/:id/fulfillments
```
**Body:**
```json
{
  "items": [
    {
      "orderItemId": "item_123",
      "quantity": 2
    }
  ],
  "trackingCompany": "UPS",
  "trackingNumber": "1Z999AA1234567890",
  "estimatedDelivery": "2025-08-10T12:00:00Z"
}
```

#### Update Fulfillment Status
```http
PATCH /api/orders/:id/fulfillments/:fulfillmentId
```
**Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "1Z999AA1234567890",
  "trackingCompany": "UPS"
}
```

#### Financial Summary
```http
GET /api/orders/:id/financial-summary
```
**Response:**
```json
{
  "orderId": "order_123",
  "orderNumber": "ORD-001",
  "currency": "USD",
  "subtotal": 100.00,
  "taxAmount": 8.00,
  "shippingAmount": 10.00,
  "discountAmount": 5.00,
  "total": 113.00,
  "totalPaid": 113.00,
  "totalRefunded": 0.00,
  "remainingBalance": 0.00,
  "isPaid": true,
  "payments": [],
  "paymentMethods": ["credit_card"],
  "lastPaymentAt": "2025-08-03T12:00:00Z"
}
```

#### Fulfillment Summary
```http
GET /api/orders/:id/fulfillment-summary
```

#### Returns/Claims/Exchanges Summary
```http
GET /api/orders/:id/returns-claims-exchanges
```

## Returns Management

### Create Return Request
```http
POST /api/order-returns
```
**Body:**
```json
{
  "orderId": "order_123",
  "customerId": "customer_123",
  "reason": "damaged",
  "items": [
    {
      "orderItemId": "item_123",
      "quantity": 1,
      "reason": "Item arrived damaged",
      "condition": "damaged",
      "restockable": false,
      "refundAmount": 50.00
    }
  ],
  "customerNote": "Package was damaged during shipping",
  "refundAmount": 50.00,
  "currency": "USD"
}
```

### Update Return Status
```http
PATCH /api/order-returns/:id/status
```
**Body:**
```json
{
  "status": "approved",
  "adminNote": "Return approved for processing",
  "rejectionReason": null
}
```

### Process Refund
```http
POST /api/order-returns/:id/refund
```
**Body:**
```json
{
  "amount": 50.00,
  "paymentMethod": "original_payment_method",
  "reference": "refund_ref_123"
}
```

## Claims Management

### Create Claim
```http
POST /api/order-claims
```
**Body:**
```json
{
  "orderId": "order_123",
  "customerId": "customer_123",
  "type": "damaged",
  "items": [
    {
      "orderItemId": "item_123",
      "quantity": 1,
      "description": "Item arrived with scratches",
      "images": ["image1.jpg", "image2.jpg"],
      "replacement": {
        "productId": "product_123",
        "variantId": "variant_123",
        "quantity": 1
      }
    }
  ],
  "customerNote": "Item has visible damage",
  "attachments": [
    {
      "url": "https://example.com/damage_photo.jpg",
      "filename": "damage_photo.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000
    }
  ]
}
```

### Approve Claim
```http
POST /api/order-claims/:id/approve
```
**Body:**
```json
{
  "replacementItems": [
    {
      "claimItemId": "claim_item_123",
      "productId": "product_123",
      "variantId": "variant_123",
      "quantity": 1
    }
  ],
  "refundAmount": 25.00,
  "resolutionNote": "Replacement item will be sent"
}
```

### Reject Claim
```http
POST /api/order-claims/:id/reject
```
**Body:**
```json
{
  "resolutionNote": "Claim does not meet return policy requirements"
}
```

## Exchanges Management

### Create Exchange Request
```http
POST /api/order-exchanges
```
**Body:**
```json
{
  "orderId": "order_123",
  "customerId": "customer_123",
  "returnItems": [
    {
      "orderItemId": "item_123",
      "quantity": 1,
      "reason": "Wrong size",
      "condition": "new"
    }
  ],
  "exchangeItems": [
    {
      "productId": "product_456",
      "variantId": "variant_456",
      "quantity": 1,
      "price": 75.00,
      "productTitle": "T-Shirt",
      "variantTitle": "Large / Blue"
    }
  ],
  "reason": "Size exchange",
  "customerNote": "Need larger size",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "Anytown",
    "province": "CA",
    "country": "USA",
    "zip": "12345"
  }
}
```

### Process Exchange Payment
```http
POST /api/order-exchanges/:id/payment
```
**Body:**
```json
{
  "paymentMethod": "credit_card",
  "paymentReference": "payment_ref_456"
}
```

## Price Lists

### Create Price List
```http
POST /api/price-lists
```
**Body:**
```json
{
  "title": "B2B Pricing",
  "description": "Special pricing for business customers",
  "type": "override",
  "status": "active",
  "customerGroupIds": ["group_b2b"],
  "salesChannelIds": ["channel_web"],
  "startsAt": "2025-08-01T00:00:00Z",
  "endsAt": "2025-12-31T23:59:59Z",
  "prices": [
    {
      "productId": "product_123",
      "variantId": "variant_123",
      "currency": "USD",
      "amount": 80.00,
      "minQuantity": 10,
      "maxQuantity": null
    }
  ]
}
```

### Get Product Prices
```http
GET /api/price-lists/product/:productId/prices?currency=USD&customerGroupId=group_b2b&quantity=15
```
**Response:**
```json
{
  "productId": "product_123",
  "variantId": null,
  "currency": "USD",
  "quantity": 15,
  "prices": [
    {
      "id": "price_123",
      "productId": "product_123",
      "variantId": "variant_123",
      "currency": "USD",
      "amount": 80.00,
      "minQuantity": 10,
      "maxQuantity": null,
      "priceListId": "pricelist_456",
      "priceListTitle": "B2B Pricing",
      "priceListType": "override"
    }
  ]
}
```

### Add Price to Price List
```http
POST /api/price-lists/:id/prices
```
**Body:**
```json
{
  "productId": "product_789",
  "variantId": "variant_789",
  "currency": "USD",
  "amount": 120.00,
  "minQuantity": 5,
  "maxQuantity": 50
}
```

## Sales Channels

### Create Sales Channel
```http
POST /api/sales-channels
```
**Body:**
```json
{
  "name": "Web Store",
  "description": "Main online storefront",
  "isActive": true,
  "isDefault": true,
  "supportedCurrencies": ["USD", "EUR", "GBP"],
  "defaultCurrency": "USD",
  "stockLocationIds": ["location_main"],
  "shippingProfileIds": ["shipping_standard"]
}
```

### Get Default Sales Channel
```http
GET /api/sales-channels/default/channel
```

### Add Currency to Sales Channel
```http
POST /api/sales-channels/:id/currencies
```
**Body:**
```json
{
  "currency": "CAD",
  "setAsDefault": false
}
```

### Set Default Sales Channel
```http
POST /api/sales-channels/:id/set-default
```

## Multi-Currency Support

### Features

1. **Order Currency**: Each order has a primary currency
2. **Payment Currency**: Payments can be in different currencies
3. **Price List Currency**: Prices can be set in multiple currencies
4. **Sales Channel Currencies**: Each channel supports specific currencies
5. **Exchange Calculations**: Automatic currency conversion for exchanges

### Currency Handling

- Orders store currency and all amounts in that currency
- Price lists can have different prices for different currencies
- Sales channels define which currencies they support
- Exchange rates can be handled at the application level
- Refunds and exchanges maintain currency consistency

### Example Multi-Currency Order

```json
{
  "id": "order_123",
  "currency": "EUR",
  "total": 85.00,
  "salesChannelId": "channel_eu",
  "payments": [
    {
      "id": "payment_123",
      "amount": 85.00,
      "currency": "EUR",
      "method": "stripe",
      "status": "paid"
    }
  ]
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Pagination

List endpoints support pagination:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting:

- `?status=active`
- `?sortBy=createdAt&sortOrder=desc`
- `?search=keyword`
- `?page=1&limit=50`
