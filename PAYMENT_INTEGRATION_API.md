# Payment Integration API Documentation

This document describes the comprehensive Payment Integration system implemented for the headless e-commerce platform, including support for Stripe and PayPal payment gateways.

## Overview

The Payment Integration system provides:
- **Payment Intents**: Secure payment processing with multiple gateway support
- **Saved Payment Methods**: Customer payment card and method management
- **Webhooks**: Real-time payment status updates from gateways
- **Refund Processing**: Automated refund handling and tracking
- **Multi-gateway Support**: Stripe and PayPal integration

## Architecture

### Entities
- `PaymentIntent`: Main payment processing entity
- `SavedPaymentMethod`: Customer saved payment methods
- `Refund`: Refund tracking and management
- `WebhookEvent`: Webhook event logging and processing

### Services
- `StripeService`: Stripe payment gateway integration
- `PayPalService`: PayPal payment gateway integration

### Authentication
- Customer authentication for payment methods
- Admin authentication for payment management
- API key support for programmatic access

## API Endpoints

### Payment Intents

#### Create Payment Intent
```http
POST /api/payment-intents
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000,
  "currency": "usd",
  "gateway": "stripe",
  "customerId": "customer_123",
  "orderId": "order_456",
  "paymentMethodId": "pm_123",
  "captureMethod": "automatic",
  "description": "Payment for order #456",
  "metadata": {
    "orderId": "order_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pi_1234567890",
    "customerId": "customer_123",
    "orderId": "order_456",
    "amount": 1000,
    "currency": "usd",
    "status": "requires_confirmation",
    "gateway": "stripe",
    "clientSecret": "pi_1234567890_secret_xyz",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Payment Intent
```http
GET /api/payment-intents/{id}
Authorization: Bearer <token>
```

#### Confirm Payment Intent
```http
POST /api/payment-intents/{id}/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethodId": "pm_123"
}
```

#### Capture Payment Intent (Manual Capture)
```http
POST /api/payment-intents/{id}/capture
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000
}
```

#### Cancel Payment Intent
```http
POST /api/payment-intents/{id}/cancel
Authorization: Bearer <token>
```

#### List Payment Intents
```http
GET /api/payment-intents?status=succeeded&gateway=stripe&page=1&limit=10
Authorization: Bearer <token>
```

### Saved Payment Methods

#### Get Customer's Payment Methods
```http
GET /api/customers/{customerId}/payment-methods
Authorization: Bearer <customer_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "spm_123",
      "type": "card",
      "isDefault": true,
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "displayName": "VISA •••• 4242",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Save Payment Method
```http
POST /api/customers/{customerId}/payment-methods
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "type": "card",
  "stripePaymentMethodId": "pm_1234567890",
  "isDefault": true,
  "metadata": {
    "nickname": "My Credit Card"
  }
}
```

#### Delete Payment Method
```http
DELETE /api/payment-methods/{paymentMethodId}
Authorization: Bearer <customer_token>
```

#### Set Default Payment Method
```http
PATCH /api/payment-methods/{paymentMethodId}/default
Authorization: Bearer <customer_token>
```

### Webhooks

#### Stripe Webhook
```http
POST /api/webhooks/stripe
Stripe-Signature: <signature>
Content-Type: application/json

{
  "id": "evt_1234567890",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "status": "succeeded"
    }
  }
}
```

#### PayPal Webhook
```http
POST /api/webhooks/paypal
Content-Type: application/json

{
  "id": "WH-1234567890",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "capture_123",
    "status": "COMPLETED"
  }
}
```

#### Get Webhook Events (Admin)
```http
GET /api/webhooks/events?provider=stripe&status=succeeded&page=1&limit=10
Authorization: Bearer <admin_token>
```

#### Retry Failed Webhook
```http
POST /api/webhooks/events/{eventId}/retry
Authorization: Bearer <admin_token>
```

### Refunds

#### Create Refund
```http
POST /api/refunds
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_123",
  "amount": 500,
  "reason": "requested_by_customer",
  "description": "Customer requested refund",
  "metadata": {
    "reason": "product_defect"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ref_123",
    "paymentIntentId": "pi_123",
    "amount": 500,
    "currency": "usd",
    "status": "succeeded",
    "reason": "requested_by_customer",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Refund
```http
GET /api/refunds/{refundId}
Authorization: Bearer <token>
```

#### Get Refunds for Payment Intent
```http
GET /api/refunds/payment-intent/{paymentIntentId}
Authorization: Bearer <token>
```

#### List All Refunds
```http
GET /api/refunds?status=succeeded&page=1&limit=10
Authorization: Bearer <token>
```

#### Cancel Refund
```http
POST /api/refunds/{refundId}/cancel
Authorization: Bearer <token>
```

## Gateway Configuration

### Stripe Configuration

Set the following environment variables:
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### PayPal Configuration

Set the following environment variables:
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or live
PAYPAL_WEBHOOK_ID=your_webhook_id
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error"
  }
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Security Features

### Authentication
- JWT-based authentication for customers and admins
- API key authentication for programmatic access
- Rate limiting on all endpoints

### Payment Security
- Webhook signature verification
- Payment method tokenization
- PCI DSS compliance through gateway providers
- Secure client secrets for frontend integration

### Data Protection
- Sensitive payment data stored only with gateway providers
- Local storage of only necessary metadata
- Encrypted data transmission (HTTPS required)

## Testing

### Test Payment Methods

#### Stripe Test Cards
```javascript
// Successful payment
4242424242424242

// Declined card
4000000000000002

// Requires authentication
4000002500003155
```

#### PayPal Test Credentials
Use PayPal's sandbox environment with test accounts for development.

### Webhook Testing

Use tools like ngrok for local webhook testing:
```bash
ngrok http 3000
# Use the ngrok URL for webhook endpoints in gateway dashboards
```

## Monitoring and Logging

The system provides comprehensive logging for:
- Payment intent creation and status changes
- Webhook event processing
- Refund processing
- Authentication and authorization events
- Error tracking and debugging

Monitor webhook events through the admin API to ensure proper payment processing and handle any failed events.

## Integration Examples

### Frontend Payment Flow

1. Create payment intent on server
2. Use client secret in frontend (Stripe Elements/PayPal SDK)
3. Confirm payment on frontend
4. Handle webhook events for status updates
5. Update order status based on payment results

### Subscription Payments (Future Enhancement)

The current system provides the foundation for subscription payments:
- Saved payment methods for recurring charges
- Webhook handling for subscription events
- Customer payment method management

## Rate Limits

Default rate limits:
- Payment Intents: 100 requests/minute per user
- Payment Methods: 50 requests/minute per user  
- Webhooks: 1000 requests/minute per endpoint
- Refunds: 20 requests/minute per user

## Support and Troubleshooting

### Common Issues

1. **Webhook signature verification failures**
   - Verify webhook secret configuration
   - Check raw body parsing for webhooks

2. **Payment method attachment failures**
   - Ensure payment method exists in gateway
   - Verify customer ID matches

3. **Refund processing failures**
   - Check payment intent status
   - Verify available refund amount

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

This documentation provides a complete reference for integrating with the Payment Integration system. For additional support, refer to the gateway-specific documentation for Stripe and PayPal.
