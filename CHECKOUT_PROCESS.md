# Checkout Process

The checkout flow converts a completed cart into an order and records payment in a single transaction.

## Endpoint

`POST /api/checkout`

### Request Body

```
{
  "cartId": "string",
  "customer": {
    "email": "test@example.com",
    "billingAddress": { ... },
    "shippingAddress": { ... }
  },
  "shippingMethod": {
    "shippingOptionId": "opt_123",
    "name": "Standard",
    "price": 10
  },
  "payment": {
    "paymentIntentId": "pi_123",
    "paymentMethodId": "pm_123"
  }
}
```

## Flow

1. Validate the cart and merge any customer or address information.
2. Apply the selected shipping method and recalculate taxes and totals.
3. Confirm the provided payment intent with the payment gateway.
4. Create the order and payment records inside a database transaction.
5. Return the newly created order or actionable validation errors.

### Successful Response

```
{
  "order": { /* order data */ }
}
```

### Error Response

```
{
  "errors": ["Cart not found"]
}
```

This process ensures that validation, pricing calculations, payment confirmation, and order creation either complete together or are rolled back on failure.
