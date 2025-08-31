# Default Admin User - Development Guide

## 📋 Admin Credentials

For development purposes, a default admin user has been created:

- **Email**: `admin@example.com`
- **Password**: `123`
- **Role**: `admin`

## 🚀 How to Use

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Login via API
Make a POST request to the admin login endpoint:

```bash
# Using curl
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "123"}'
```

### 3. Login via Admin Panel
If you have an admin frontend, use these credentials:
- **Email**: `admin@example.com`
- **Password**: `123`

### 4. API Endpoints
The admin user has access to all admin endpoints:
- `/api/admin/auth/login` - Login
- `/api/admin/auth/refresh` - Refresh token
- `/api/admin/auth/logout` - Logout
- `/api/admin/auth/profile` - Get admin profile

## 🔧 Development Commands

### Create Admin User (if needed)
```bash
npm run seed:admin
```

### Test Admin Login
```bash
node test-admin-login.js
```

## ⚠️ Security Notes

- This is for **development only**
- Change or remove this user in production
- The password is intentionally simple for dev convenience
- The user has email verification bypassed for development ease

## 🔄 Recreating the Admin User

If you need to recreate the admin user:

1. The script will check if admin already exists
2. If it exists, it will show the existing credentials
3. If not, it will create a new admin user

```bash
npm run seed:admin
```

## 📱 Frontend Integration

In your admin frontend (`admin/src/api/auth.ts`), you can use:

```typescript
import { login } from '@/api/auth'

const credentials = {
  email: 'admin@example.com',
  password: '123'
}

const response = await login(credentials)
// Handle successful login
```
