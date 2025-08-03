# Order Payment Management Implementation

## Overview
The payment management system has been enhanced to support comprehensive order payment operations including authorization, capture, refunding, and handling outstanding amounts as described in your requirements.

## Payment Statuses Supported

### Payment Entity Statuses
- `PENDING` - Initial state when payment is created
- `AUTHORIZED` - Payment is authorized but not yet captured
- `PARTIALLY_AUTHORIZED` - Part of the payment is authorized
- `PROCESSING` - Payment is being processed
- `COMPLETED` - Payment completed (legacy support)
- `CAPTURED` - Payment has been captured and processed
- `PARTIALLY_CAPTURED` - Part of the payment has been captured
- `FAILED` - Payment failed
- `CANCELLED` - Payment was cancelled
- `REFUNDED` - Payment has been fully refunded
- `PARTIALLY_REFUNDED` - Payment has been partially refunded

### Order Financial Statuses
- `PENDING` - Default status when order is placed
- `AUTHORIZED` - Payment is authorized but not captured
- `PARTIALLY_PAID` - Part of the payment has been made
- `PAID` - Order is fully paid
- `PARTIALLY_REFUNDED` - Part of the payment has been refunded
- `REFUNDED` - Full payment has been refunded

## API Endpoints

### Payment Management (General)

#### Capture Payment
```
POST /api/payments/:id/capture
Body: { amount?: number }
```
Captures an authorized payment. If amount is not provided, captures the full authorized amount.

#### Refund Payment
```
POST /api/payments/:id/refund
Body: { amount?: number, reason?: string }
```
Refunds a captured payment. If amount is not provided, refunds the full refundable amount.

### Order-Specific Payment Management

#### Capture Order Payment
```
POST /api/orders/:id/capture-payment
Body: { paymentId: string, amount?: number }
```
Captures a specific payment for an order and updates the order's financial status.

#### Refund Order Payment
```
POST /api/orders/:id/refund-payment
Body: { paymentId: string, amount?: number, note?: string }
```
Refunds a specific payment for an order with optional customer note.

#### Mark Order as Paid Manually
```
POST /api/orders/:id/mark-paid
Body: { note?: string }
```
Manually marks an order as paid for the outstanding amount. This handles capturing payment outside of the integrated payment provider.

#### Generate Payment Link
```
GET /api/orders/:id/payment-link
```
Generates a payment link for the customer to pay any outstanding amount.

Response:
```json
{
  "paymentLink": "http://localhost:3001/checkout/payment/order-id?amount=50.00",
  "outstandingAmount": 50.00,
  "currency": "USD",
  "orderNumber": "ORD-12345"
}
```

#### Get Outstanding Amounts
```
GET /api/orders/:id/outstanding
```
Returns detailed information about the order's payment status and outstanding amounts.

Response:
```json
{
  "orderId": "order-id",
  "orderNumber": "ORD-12345",
  "total": 100.00,
  "totalPaid": 50.00,
  "totalRefunded": 0.00,
  "outstandingAmount": 50.00,
  "currency": "USD",
  "financialStatus": "partially_paid",
  "payments": [
    {
      "id": "payment-id",
      "amount": 50.00,
      "status": "captured",
      "method": "stripe",
      "refundedAmount": 0,
      "createdAt": "2025-08-03T10:00:00Z"
    }
  ]
}
```

## Payment Entity Enhancements

### New Fields
- `authorizedAmount`: Amount that has been authorized
- `capturedAmount`: Amount that has been captured
- New computed properties for payment state checking

### Computed Properties
- `isAuthorized`: Check if payment is in authorized state
- `isCaptured`: Check if payment is captured
- `availableToCapture`: Amount available for capture
- `refundableAmount`: Amount available for refund

## Order Entity Enhancements

### New Computed Properties
- `outstandingAmount`: Amount still owed on the order
- `hasOutstandingAmount`: Whether there are outstanding amounts
- `canCapture`: Whether the order has payments that can be captured
- `canRefund`: Whether the order has payments that can be refunded

## Workflow Examples

### 1. Standard Payment Flow
1. Order created with `PENDING` financial status
2. Payment authorized → status becomes `AUTHORIZED`
3. Payment captured → status becomes `CAPTURED`
4. Order financial status updated to `PAID`

### 2. Partial Payment Flow
1. Order total: $100
2. First payment authorized/captured: $60 → `PARTIALLY_PAID`
3. Outstanding amount: $40
4. Second payment or manual marking completes → `PAID`

### 3. Refund Flow
1. Captured payment exists
2. Refund initiated → payment status becomes `PARTIALLY_REFUNDED` or `REFUNDED`
3. Order financial status updated accordingly

### 4. Manual Payment Handling
1. Order has outstanding amount
2. Use `POST /api/orders/:id/mark-paid` to mark as paid manually
3. Creates a manual payment record
4. Updates order status to `PAID`

### 5. Customer Payment Link
1. Order has outstanding amount
2. Use `GET /api/orders/:id/payment-link` to get payment URL
3. Share link with customer
4. Customer completes payment through storefront
5. Payment is authorized, then captured as needed

## Integration Notes

### Payment Gateway Integration
The capture and refund endpoints include comments where you would integrate with actual payment gateways (Stripe, PayPal, etc.):

```typescript
// Here you would integrate with payment gateway to actually capture
// await paymentGateway.capture(payment.gatewayTransactionId, captureAmount);
```

### Frontend Integration
- Payment links are generated to redirect to your storefront checkout
- The `STOREFRONT_URL` environment variable should be configured
- Outstanding amounts are calculated automatically based on order changes

## Security Considerations
- All payment operations should be authenticated and authorized
- Refunds are irreversible - ensure proper confirmation flows
- Payment capture should integrate with actual payment providers
- Audit logging should be implemented for all payment operations

## Testing
Use the provided test scripts to validate the payment management functionality:
- `test-endpoints.ps1` - General API testing
- `test-order-management.js` - Order-specific scenarios
