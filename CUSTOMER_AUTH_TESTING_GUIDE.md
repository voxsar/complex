# Customer Authentication & Loyalty System Testing Guide

This guide covers all the customer authentication, loyalty program, and order management features.

## 🏪 Customer Features Overview

### Authentication & Account Management
- Customer registration with email verification
- Customer login/logout with JWT tokens
- Password reset functionality
- Profile management
- Address book management

### Loyalty Program
- Points earning on purchases
- Tier-based benefits (Bronze, Silver, Gold, Platinum)
- Points redemption for discounts
- Birthday discounts
- First-time buyer discounts

### Order Management
- Order history tracking
- Purchase analytics
- Loyalty points earned per order

## 📋 API Endpoints

### Public Customer Routes

#### 1. Customer Registration
```http
POST /api/customers/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "acceptsMarketing": true
}
```

**Response:**
```json
{
  "message": "Customer registered successfully",
  "customer": {
    "id": "customer_id",
    "email": "customer@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "loyaltyTier": "Bronze",
    "loyaltyPoints": 0,
    "isEmailVerified": false
  },
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "verificationRequired": true
}
```

#### 2. Customer Login
```http
POST /api/customers/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "customer": { /* customer data */ },
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "loyaltyInfo": {
    "currentTier": "Bronze",
    "points": 100,
    "nextTierThreshold": 1000,
    "benefits": {
      "pointsMultiplier": 1.0,
      "freeShippingThreshold": 100,
      "birthdayDiscount": 5
    }
  }
}
```

#### 3. Refresh Token
```http
POST /api/customers/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

#### 4. Forgot Password
```http
POST /api/customers/forgot-password
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

#### 5. Reset Password
```http
POST /api/customers/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

#### 6. Verify Email
```http
GET /api/customers/verify-email/:token
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "welcomeBonus": 100,
  "loyaltyInfo": {
    "tier": "Bronze",
    "points": 100
  }
}
```

### Protected Customer Routes

All protected routes require the Authorization header:
```http
Authorization: Bearer YOUR_CUSTOMER_JWT_TOKEN
```

#### 7. Get Customer Profile
```http
GET /api/customers/profile
```

**Response:**
```json
{
  "customer": { /* full customer data */ },
  "loyaltyInfo": {
    "currentTier": "Bronze",
    "points": 150,
    "lifetimePoints": 150,
    "nextTierThreshold": 1000,
    "multiplier": 1.0,
    "benefits": { /* tier benefits */ }
  },
  "availableDiscounts": [
    {
      "type": "first_time",
      "value": 10,
      "description": "First-time buyer 10% discount"
    }
  ],
  "pointsRedemptionOptions": [
    { "points": 100, "value": 5, "description": "$5 off your order" },
    { "points": 250, "value": 15, "description": "$15 off your order" }
  ]
}
```

#### 8. Update Customer Profile
```http
PUT /api/customers/profile
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1987654321",
  "dateOfBirth": "1990-05-15",
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "marketing": {
      "newsletter": true,
      "promotions": false,
      "newProducts": true
    },
    "language": "en",
    "currency": "USD"
  }
}
```

#### 9. Change Password
```http
POST /api/customers/change-password
Content-Type: application/json

{
  "currentPassword": "currentPassword123",
  "newPassword": "newPassword456"
}
```

#### 10. Resend Verification Email
```http
POST /api/customers/resend-verification
```

### Loyalty & Rewards Routes

#### 11. Get Loyalty Dashboard
```http
GET /api/customers/loyalty
```

**Response:**
```json
{
  "loyaltyProgram": {
    "currentTier": "Silver",
    "points": 1250,
    "lifetimePoints": 2500,
    "nextTierThreshold": 5000,
    "pointsToNextTier": 2500,
    "multiplier": 1.2,
    "joinedAt": "2025-01-01T00:00:00.000Z"
  },
  "tierBenefits": {
    "current": {
      "pointsMultiplier": 1.2,
      "freeShippingThreshold": 75,
      "birthdayDiscount": 10
    },
    "allTiers": { /* all tier benefits */ }
  },
  "redemptionOptions": [
    { "points": 100, "value": 5, "description": "$5 off your order" }
  ],
  "availableDiscounts": [ /* current discounts */ ]
}
```

#### 12. Redeem Loyalty Points
```http
POST /api/customers/loyalty/redeem
Content-Type: application/json

{
  "pointsToRedeem": 250
}
```

**Response:**
```json
{
  "message": "Points redeemed successfully",
  "redemptionCode": "POINTS1704285600000",
  "discount": 15,
  "pointsRedeemed": 250,
  "remainingPoints": 1000
}
```

### Address Management Routes

#### 13. Get Customer Addresses
```http
GET /api/customers/addresses
```

#### 14. Add Customer Address
```http
POST /api/customers/addresses
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "company": "Acme Corp",
  "address1": "123 Main St",
  "address2": "Apt 4B",
  "city": "New York",
  "province": "NY",
  "country": "US",
  "zip": "10001",
  "phone": "+1234567890",
  "isDefault": true
}
```

#### 15. Update Customer Address
```http
PUT /api/customers/addresses/:addressId
Content-Type: application/json

{
  "address1": "456 Oak Avenue",
  "isDefault": false
}
```

#### 16. Delete Customer Address
```http
DELETE /api/customers/addresses/:addressId
```

### Order Management Routes

#### 17. Get Customer Orders
```http
GET /api/customers/orders?page=1&limit=10&status=delivered
```

**Response:**
```json
{
  "orders": [
    {
      "id": "order_1",
      "orderNumber": "ORD-2025-001",
      "status": "delivered",
      "total": 129.99,
      "items": [
        {
          "productId": "prod_1",
          "name": "Sample Product",
          "quantity": 2,
          "price": 64.99
        }
      ],
      "createdAt": "2025-01-15T00:00:00.000Z",
      "deliveredAt": "2025-01-18T00:00:00.000Z",
      "pointsEarned": 129
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "orderStats": {
    "totalOrders": 5,
    "totalSpent": 649.95,
    "averageOrderValue": 129.99,
    "lastOrderAt": "2025-01-18T00:00:00.000Z"
  }
}
```

#### 18. Get Specific Order
```http
GET /api/customers/orders/:orderId
```

#### 19. Logout
```http
POST /api/customers/logout
```

## 🧪 Testing Workflow

### 1. Registration & Login Flow
```bash
# 1. Register a new customer
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.customer@example.com",
    "password": "testPassword123",
    "firstName": "Test",
    "lastName": "Customer",
    "acceptsMarketing": true
  }'

# 2. Copy the token from response and verify email
curl -X GET http://localhost:3000/api/customers/verify-email/VERIFICATION_TOKEN

# 3. Login
curl -X POST http://localhost:3000/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.customer@example.com",
    "password": "testPassword123"
  }'
```

### 2. Profile & Loyalty Testing
```bash
# Set your token as a variable
TOKEN="your_jwt_token_here"

# Get profile with loyalty info
curl -X GET http://localhost:3000/api/customers/profile \
  -H "Authorization: Bearer $TOKEN"

# Get loyalty dashboard
curl -X GET http://localhost:3000/api/customers/loyalty \
  -H "Authorization: Bearer $TOKEN"

# Redeem points (if you have enough)
curl -X POST http://localhost:3000/api/customers/loyalty/redeem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pointsToRedeem": 100}'
```

### 3. Address Management Testing
```bash
# Add an address
curl -X POST http://localhost:3000/api/customers/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Customer",
    "address1": "123 Test St",
    "city": "Test City",
    "province": "TC",
    "country": "US",
    "zip": "12345",
    "isDefault": true
  }'

# Get addresses
curl -X GET http://localhost:3000/api/customers/addresses \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 Loyalty Program Details

### Tier Requirements
- **Bronze**: 0+ lifetime points (default)
- **Silver**: 1,000+ lifetime points
- **Gold**: 5,000+ lifetime points  
- **Platinum**: 15,000+ lifetime points

### Tier Benefits
| Benefit | Bronze | Silver | Gold | Platinum |
|---------|--------|--------|------|----------|
| Points Multiplier | 1.0x | 1.2x | 1.5x | 2.0x |
| Free Shipping | $100+ | $75+ | $50+ | Always |
| Birthday Discount | 5% | 10% | 15% | 20% |
| Return Window | 30 days | 45 days | 60 days | 90 days |
| Early Access | No | No | Yes | Yes |

### Points Redemption Options
- 100 points = $5 off
- 250 points = $15 off  
- 500 points = $35 off
- 1,000 points = $75 off
- 2,000 points = $160 off

### Automatic Discounts
- **First-time buyers**: 10% off
- **Birthday month**: Tier-based discount
- **Loyalty tier**: Ongoing percentage based on tier

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on auth endpoints (5 attempts per 15 minutes)
- Email verification required
- Secure password reset with tokens
- Token validation and expiration

## 📊 Analytics & Insights

The system tracks:
- Total orders and spending per customer
- Loyalty points earned and redeemed
- Tier progression history
- Purchase patterns and preferences
- Address book management
- Marketing preferences

This comprehensive customer system provides a complete e-commerce customer experience with authentication, loyalty rewards, and order management! 🚀
