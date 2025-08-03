# Cart Module Implementation Guide

## Overview

The Cart Module provides comprehensive shopping cart functionality that acts as a bridge between your product catalog and order management system. This implementation matches and extends Medusa.js Cart Module features while integrating seamlessly with your existing e-commerce system.

## 🛒 Cart Features

### Core Cart Management
- **Cart Creation**: Create carts for guests or authenticated customers
- **Session Persistence**: Link carts to browser sessions for guest checkout
- **Multi-Currency Support**: Support for different currencies per sales channel
- **Sales Channel Scoping**: Associate carts with specific sales channels
- **Cart Types**: Support for different cart types (default, swap, payment_link, draft_order)

### Line Item Management
- **Add Items**: Add products with variants to cart
- **Update Quantities**: Modify item quantities with automatic total recalculation
- **Remove Items**: Remove individual items from cart
- **Product Snapshots**: Store product data at time of addition for consistency
- **Inventory Tracking**: Track available inventory for each variant

### Promotion & Tax System
- **Discount Application**: Apply percentage, fixed amount, or free shipping promotions
- **Tax Calculations**: Automatic tax calculation based on shipping address
- **Tax Region Support**: Integration with tax regions for accurate tax rates
- **Promotion Validation**: Ensure promotions are valid and active

### Address & Shipping
- **Billing Address**: Store customer billing information
- **Shipping Address**: Store delivery address with tax region auto-detection
- **Shipping Methods**: Select and price shipping options
- **Multi-Address Support**: Different billing and shipping addresses

### Checkout & Conversion
- **Checkout Validation**: Comprehensive validation before order creation
- **Cart to Order**: Seamless conversion from cart to order
- **Order Integration**: Full integration with existing order management system

## 🏗️ Technical Architecture

### Entities

#### Cart Entity
```typescript
@Entity("carts")
export class Cart {
  id: string;
  status: CartStatus; // active, abandoned, completed, expired
  type: CartType; // default, swap, payment_link, draft_order
  currency: string;
  
  // Customer Information
  customerId?: string;
  email?: string;
  sessionId?: string;
  
  // Financial Totals
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  
  // Addresses
  billingAddress?: Address;
  shippingAddress?: Address;
  
  // Associations
  salesChannelId?: string;
  regionId?: string;
  taxRegionId?: string;
  priceListId?: string;
  
  // Line Items
  items: CartLineItem[];
  
  // Discounts & Shipping
  discounts: CartDiscount[];
  shippingMethods: ShippingMethod[];
  
  // Tax Information
  taxBreakdown: TaxBreakdown[];
  
  // Metadata
  customerNote?: string;
  metadata?: Record<string, any>;
  
  // Lifecycle
  expiresAt?: Date;
  completedAt?: Date;
  orderId?: string; // Reference when converted to order
}
```

#### Cart Line Item
```typescript
interface CartLineItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discountTotal: number;
  taxTotal: number;
  productTitle: string;
  variantTitle: string;
  productSku?: string;
  metadata?: Record<string, any>;
  productSnapshot?: ProductSnapshot;
  createdAt: Date;
  updatedAt: Date;
}
```

### Services

#### CartService
Main service for cart operations:
- Cart CRUD operations
- Line item management
- Discount application
- Address updates
- Tax calculations
- Price calculations

#### CartToOrderService
Handles cart to order conversion:
- Checkout validation
- Order creation from cart
- Cart completion
- Order number generation

### Enums

```typescript
enum CartStatus {
  ACTIVE = "active",
  ABANDONED = "abandoned", 
  COMPLETED = "completed",
  EXPIRED = "expired"
}

enum CartType {
  DEFAULT = "default",
  SWAP = "swap",
  PAYMENT_LINK = "payment_link",
  DRAFT_ORDER = "draft_order"
}
```

## 📚 API Reference

### Cart Management

#### Create Cart
```http
POST /api/carts
```
**Body:**
```json
{
  "customerId": "customer_123",
  "email": "john@example.com",
  "currency": "USD",
  "salesChannelId": "channel_web",
  "regionId": "US",
  "sessionId": "session_abc123",
  "type": "default"
}
```

#### Get Cart
```http
GET /api/carts/:id
```

#### Get Active Cart by Customer
```http
GET /api/carts/customer/:customerId/active
```

#### Get Active Cart by Session
```http
GET /api/carts/session/:sessionId/active
```

### Line Item Management

#### Add Line Item
```http
POST /api/carts/:id/line-items
```
**Body:**
```json
{
  "productId": "product_123",
  "variantId": "variant_456",
  "quantity": 2,
  "metadata": {
    "gift_wrap": true
  }
}
```

#### Update Line Item
```http
PATCH /api/carts/:id/line-items/:itemId
```
**Body:**
```json
{
  "quantity": 3
}
```

#### Remove Line Item
```http
DELETE /api/carts/:id/line-items/:itemId
```

### Discounts & Shipping

#### Apply Discount
```http
POST /api/carts/:id/discounts
```
**Body:**
```json
{
  "promotionId": "promo_123"
}
```

#### Remove Discount
```http
DELETE /api/carts/:id/discounts/:discountId
```

#### Set Shipping Method
```http
POST /api/carts/:id/shipping-methods
```
**Body:**
```json
{
  "shippingOptionId": "standard_shipping",
  "name": "Standard Shipping (5-7 days)",
  "price": 9.99,
  "data": {
    "carrier": "UPS",
    "estimatedDays": 6
  }
}
```

### Address Management

#### Update Addresses
```http
PATCH /api/carts/:id/addresses
```
**Body:**
```json
{
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "Anytown",
    "province": "CA",
    "country": "US",
    "zip": "12345",
    "phone": "+1-555-0123"
  },
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "456 Oak Ave",
    "city": "Anytown",
    "province": "CA",
    "country": "US",
    "zip": "12345"
  }
}
```

### Checkout Process

#### Get Checkout Summary
```http
GET /api/carts/:id/checkout-summary
```
**Response:**
```json
{
  "cart": { /* full cart object */ },
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "totals": {
    "itemsCount": 3,
    "subtotal": 89.97,
    "taxAmount": 7.20,
    "shippingAmount": 9.99,
    "discountAmount": 10.00,
    "total": 97.16,
    "currency": "USD"
  },
  "readyForCheckout": true
}
```

#### Validate Cart
```http
GET /api/carts/:id/validate
```

#### Create Order from Cart
```http
POST /api/carts/:id/checkout
```
**Body:**
```json
{
  "orderNumber": "ORD-12345",
  "note": "Please handle with care",
  "adminNote": "VIP customer",
  "tags": ["priority", "gift"],
  "metadata": {
    "giftWrap": true,
    "deliveryInstructions": "Leave at door"
  }
}
```

### Cart Lifecycle

#### Update Cart
```http
PATCH /api/carts/:id
```
**Body:**
```json
{
  "email": "newemail@example.com",
  "customerNote": "Special delivery instructions",
  "metadata": {
    "preferredDeliveryTime": "morning"
  }
}
```

#### Complete Cart
```http
POST /api/carts/:id/complete
```
**Body:**
```json
{
  "orderId": "order_789"
}
```

#### Abandon Cart
```http
POST /api/carts/:id/abandon
```

#### Delete Cart
```http
DELETE /api/carts/:id
```

## 🔄 Cart to Order Flow

### 1. Cart Creation
```javascript
// Customer starts shopping
const cart = await fetch('/api/carts', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'customer_123',
    currency: 'USD',
    salesChannelId: 'web_store'
  })
});
```

### 2. Add Products
```javascript
// Add items to cart
await fetch(`/api/carts/${cartId}/line-items`, {
  method: 'POST',
  body: JSON.stringify({
    productId: 'product_123',
    variantId: 'variant_456',
    quantity: 2
  })
});
```

### 3. Set Addresses
```javascript
// Add shipping/billing addresses
await fetch(`/api/carts/${cartId}/addresses`, {
  method: 'PATCH',
  body: JSON.stringify({
    shippingAddress: { /* address details */ },
    billingAddress: { /* address details */ }
  })
});
```

### 4. Apply Promotions
```javascript
// Apply discounts
await fetch(`/api/carts/${cartId}/discounts`, {
  method: 'POST',
  body: JSON.stringify({
    promotionId: 'promo_10off'
  })
});
```

### 5. Select Shipping
```javascript
// Choose shipping method
await fetch(`/api/carts/${cartId}/shipping-methods`, {
  method: 'POST',
  body: JSON.stringify({
    shippingOptionId: 'standard',
    name: 'Standard Shipping',
    price: 9.99
  })
});
```

### 6. Checkout Validation
```javascript
// Validate cart before checkout
const validation = await fetch(`/api/carts/${cartId}/validate`);
if (!validation.isValid) {
  // Handle validation errors
  console.log('Errors:', validation.errors);
}
```

### 7. Create Order
```javascript
// Convert cart to order
const order = await fetch(`/api/carts/${cartId}/checkout`, {
  method: 'POST',
  body: JSON.stringify({
    note: 'Customer note here'
  })
});
```

## 🧪 Testing

### Run Demo Script
```bash
# Make sure your server is running on localhost:3000
node cart-demo.js
```

The demo script will:
1. Create a new cart
2. Add multiple items
3. Set addresses
4. Apply shipping method
5. Apply discount (if promotions are available)
6. Validate for checkout
7. Convert to order
8. Show final results

### Manual Testing

#### 1. Create Test Cart
```bash
curl -X POST http://localhost:3000/api/carts \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD",
    "email": "test@example.com",
    "sessionId": "test_session_123"
  }'
```

#### 2. Add Test Item
```bash
curl -X POST http://localhost:3000/api/carts/{CART_ID}/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test_product",
    "variantId": "test_variant",
    "quantity": 1
  }'
```

#### 3. Get Cart Details
```bash
curl http://localhost:3000/api/carts/{CART_ID}
```

## 🔌 Integration Points

### With Existing Systems

#### Product Catalog
- Retrieves product and variant information
- Captures product snapshots for consistency
- Validates variant availability

#### Promotion System
- Applies active promotions
- Calculates discount amounts
- Validates promotion rules

#### Tax System
- Calculates taxes based on addresses
- Applies tax region rules
- Handles tax overrides

#### Order Management
- Converts carts to orders seamlessly
- Preserves all cart data in order
- Links cart to created order

#### Customer Management
- Associates carts with customers
- Supports guest checkout
- Manages customer addresses

## 🚀 Production Considerations

### Performance
- Index frequently queried fields (customerId, sessionId, status)
- Consider cart cleanup for abandoned carts
- Cache tax calculations for performance

### Security
- Validate all input data
- Ensure customers can only access their own carts
- Sanitize address data

### Monitoring
- Track cart abandonment rates
- Monitor conversion rates
- Alert on checkout errors

### Scalability
- Consider cart data archival strategy
- Implement cart expiration cleanup
- Use database transactions for critical operations

## 🔮 Future Enhancements

### Potential Improvements
1. **Saved Carts**: Allow customers to save carts for later
2. **Cart Sharing**: Enable cart sharing via links
3. **Inventory Reservations**: Reserve inventory for items in cart
4. **Real-time Updates**: WebSocket integration for live cart updates
5. **Analytics**: Detailed cart analytics and abandonment tracking
6. **A/B Testing**: Support for cart experience testing

### Integration Opportunities
1. **Payment Providers**: Integrate with payment gateways for faster checkout
2. **Shipping Providers**: Real-time shipping rate calculation
3. **Recommendation Engine**: Suggest related products during cart review
4. **Inventory Service**: Real-time inventory checking and reservations

---

## 📋 Summary

Your Cart Module now provides:

✅ **Complete cart lifecycle management**
✅ **Seamless product-to-order flow**
✅ **Advanced promotion and tax support**
✅ **Multi-currency and multi-channel support**
✅ **Comprehensive address management**
✅ **Flexible shipping method selection**
✅ **Robust checkout validation**
✅ **Full integration with existing order system**

The Cart Module successfully bridges the gap between your product catalog and order management, providing a complete pre-purchase experience that matches Medusa.js functionality while integrating perfectly with your existing e-commerce architecture!
