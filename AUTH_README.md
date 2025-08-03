# Authentication System

This project includes a comprehensive authentication system with JWT tokens, role-based access control, and user management features.

## Features

### 🔐 Authentication
- **User Registration**: Create new user accounts with email verification
- **User Login**: Authenticate with email and password
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: Long-lived tokens for seamless re-authentication
- **Password Reset**: Secure password recovery via email
- **Email Verification**: Account verification system
- **Logout**: Token invalidation

### 👥 User Roles
- **Customer**: Basic user role with limited access
- **Staff**: Employee role with enhanced permissions
- **Manager**: Management role with administrative access
- **Admin**: Full administrative access

### 🛡️ Security Features
- **Password Hashing**: Secure bcrypt password storage
- **Token Validation**: Comprehensive JWT validation
- **Rate Limiting**: Protection against brute force attacks
- **Role-Based Access Control**: Granular permission system
- **Account Status**: Active/inactive account management
- **Email Verification**: Prevent spam and validate emails

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_minimum_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production_minimum_32_characters
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (for password reset and verification)
EMAIL_FROM=noreply@yourapp.com
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### User Registration
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### User Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Refresh Token
```http
POST /api/users/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

#### Forgot Password
```http
POST /api/users/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/users/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

#### Verify Email
```http
GET /api/users/verify-email/:token
```

### Protected Endpoints (Authentication Required)

All protected endpoints require the `Authorization` header:
```http
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

#### Get Auth Status
```http
GET /api/users/auth/status
```

#### Get User Profile
```http
GET /api/users/profile
```

#### Update Profile
```http
PUT /api/users/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1987654321",
  "preferences": {
    "newsletter": true,
    "sms": false,
    "language": "en",
    "currency": "USD"
  }
}
```

#### Change Password
```http
POST /api/users/change-password
Content-Type: application/json

{
  "currentPassword": "currentPassword",
  "newPassword": "newPassword123"
}
```

#### Resend Verification Email
```http
POST /api/users/resend-verification
```

#### Logout
```http
POST /api/users/logout
```

### Admin Endpoints (Admin/Manager Role Required)

#### Get All Users
```http
GET /api/users?page=1&limit=20&role=customer&search=john&isActive=true&sortBy=createdAt&sortOrder=desc
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Update User (Admin Only)
```http
PUT /api/users/:id
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "role": "staff",
  "isActive": true
}
```

#### Update User Status (Admin Only)
```http
PATCH /api/users/:id/status
Content-Type: application/json

{
  "isActive": false
}
```

#### Delete User (Admin Only)
```http
DELETE /api/users/:id
```

## Authentication Demo Routes

Test different authentication levels with these demo endpoints:

```http
GET /api/auth-demo/public          # No auth required
GET /api/auth-demo/optional        # Optional auth
GET /api/auth-demo/protected       # Auth required
GET /api/auth-demo/customer        # Customer role required
GET /api/auth-demo/staff           # Staff+ role required
GET /api/auth-demo/manager         # Manager+ role required
GET /api/auth-demo/admin           # Admin role required
GET /api/auth-demo/permissions     # Check your permissions
```

## Usage Examples

### 1. Register and Login Flow
```javascript
// 1. Register
const registerResponse = await fetch('/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123',
    firstName: 'John',
    lastName: 'Doe'
  })
});

// 2. Login
const loginResponse = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123'
  })
});

const { token, refreshToken } = await loginResponse.json();

// 3. Use token for authenticated requests
const profileResponse = await fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Role-Based Access
```javascript
// Check user permissions
const authStatus = await fetch('/api/users/auth/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { user, permissions } = await authStatus.json();

if (permissions.isAdmin) {
  // Admin features
} else if (permissions.isManager) {
  // Manager features
} else if (permissions.isStaff) {
  // Staff features
} else {
  // Customer features
}
```

### 3. Token Refresh
```javascript
// When token expires, use refresh token
const refreshResponse = await fetch('/api/users/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const { token: newToken, refreshToken: newRefreshToken } = await refreshResponse.json();
```

## Error Codes

The authentication system returns specific error codes for different scenarios:

- `NO_TOKEN`: No authorization token provided
- `INVALID_TOKEN_FORMAT`: Token structure is invalid
- `USER_NOT_FOUND`: User associated with token doesn't exist
- `ACCOUNT_DEACTIVATED`: User account is deactivated
- `TOKEN_USER_MISMATCH`: Token email doesn't match user
- `TOKEN_EXPIRED`: Token has expired
- `INVALID_TOKEN`: Token signature or format is invalid
- `NOT_AUTHENTICATED`: Authentication required but not provided
- `INSUFFICIENT_PERMISSIONS`: User doesn't have required role
- `EMAIL_NOT_VERIFIED`: Email verification required
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Security Best Practices

1. **Environment Variables**: Always use strong, unique secrets in production
2. **HTTPS**: Use HTTPS in production to protect tokens in transit
3. **Token Storage**: Store tokens securely (httpOnly cookies recommended)
4. **Token Expiration**: Use short-lived access tokens with refresh tokens
5. **Rate Limiting**: Implement rate limiting on authentication endpoints
6. **Password Policy**: Enforce strong password requirements
7. **Account Lockout**: Consider implementing account lockout after failed attempts
8. **Audit Logging**: Log authentication events for security monitoring

## Testing

Use the `auth-testing-guide.ts` file for comprehensive testing examples, or test the demo routes:

```bash
# Start the server
npm run dev

# Test public route (no auth)
curl http://localhost:3000/api/auth-demo/public

# Test protected route (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth-demo/protected
```
