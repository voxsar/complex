/**
 * Authentication Testing Guide
 * 
 * This file contains example requests to test all authentication features.
 * Use tools like Postman, curl, or any HTTP client to test these endpoints.
 */

// Base URL for all requests
const BASE_URL = "http://localhost:3000/api";

/**
 * 1. USER REGISTRATION
 * POST /api/users/register
 */
const registerUser = {
  method: "POST",
  url: `${BASE_URL}/users/register`,
  headers: {
    "Content-Type": "application/json"
  },
  body: {
    email: "john.doe@example.com",
    password: "securePassword123",
    firstName: "John",
    lastName: "Doe",
    phone: "+1234567890"
  }
};

/**
 * 2. USER LOGIN
 * POST /api/users/login
 */
const loginUser = {
  method: "POST",
  url: `${BASE_URL}/users/login`,
  headers: {
    "Content-Type": "application/json"
  },
  body: {
    email: "john.doe@example.com",
    password: "securePassword123"
  }
};

/**
 * 3. REFRESH TOKEN
 * POST /api/users/refresh
 */
const refreshToken = {
  method: "POST",
  url: `${BASE_URL}/users/refresh`,
  headers: {
    "Content-Type": "application/json"
  },
  body: {
    refreshToken: "YOUR_REFRESH_TOKEN_HERE"
  }
};

/**
 * 4. CHECK AUTH STATUS
 * GET /api/users/auth/status
 */
const checkAuthStatus = {
  method: "GET",
  url: `${BASE_URL}/users/auth/status`,
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
};

/**
 * 5. GET USER PROFILE
 * GET /api/users/profile
 */
const getUserProfile = {
  method: "GET",
  url: `${BASE_URL}/users/profile`,
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
};

/**
 * 6. UPDATE USER PROFILE
 * PUT /api/users/profile
 */
const updateProfile = {
  method: "PUT",
  url: `${BASE_URL}/users/profile`,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  },
  body: {
    firstName: "John",
    lastName: "Smith",
    phone: "+1987654321",
    preferences: {
      newsletter: true,
      sms: false,
      language: "en",
      currency: "USD"
    }
  }
};

/**
 * 7. CHANGE PASSWORD
 * POST /api/users/change-password
 */
const changePassword = {
  method: "POST",
  url: `${BASE_URL}/users/change-password`,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  },
  body: {
    currentPassword: "securePassword123",
    newPassword: "newSecurePassword456"
  }
};

/**
 * 8. FORGOT PASSWORD
 * POST /api/users/forgot-password
 */
const forgotPassword = {
  method: "POST",
  url: `${BASE_URL}/users/forgot-password`,
  headers: {
    "Content-Type": "application/json"
  },
  body: {
    email: "john.doe@example.com"
  }
};

/**
 * 9. RESET PASSWORD
 * POST /api/users/reset-password
 */
const resetPassword = {
  method: "POST",
  url: `${BASE_URL}/users/reset-password`,
  headers: {
    "Content-Type": "application/json"
  },
  body: {
    token: "RESET_TOKEN_FROM_EMAIL",
    newPassword: "brandNewPassword789"
  }
};

/**
 * 10. VERIFY EMAIL
 * GET /api/users/verify-email/:token
 */
const verifyEmail = {
  method: "GET",
  url: `${BASE_URL}/users/verify-email/EMAIL_VERIFICATION_TOKEN`,
  headers: {}
};

/**
 * 11. RESEND VERIFICATION EMAIL
 * POST /api/users/resend-verification
 */
const resendVerification = {
  method: "POST",
  url: `${BASE_URL}/users/resend-verification`,
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
};

/**
 * 12. LOGOUT
 * POST /api/users/logout
 */
const logoutUser = {
  method: "POST",
  url: `${BASE_URL}/users/logout`,
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
};

/**
 * AUTH DEMO ROUTES
 * These routes demonstrate different authentication levels
 */

/**
 * 13. PUBLIC ROUTE (No auth required)
 * GET /api/auth-demo/public
 */
const publicRoute = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/public`,
  headers: {}
};

/**
 * 14. OPTIONAL AUTH ROUTE
 * GET /api/auth-demo/optional
 */
const optionalAuthRoute = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/optional`,
  headers: {
    // Include Authorization header for authenticated experience
    // "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
};

/**
 * 15. PROTECTED ROUTE (Auth required)
 * GET /api/auth-demo/protected
 */
const protectedRoute = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/protected`,
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
};

/**
 * 16. CUSTOMER ONLY ROUTE
 * GET /api/auth-demo/customer
 */
const customerOnlyRoute = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/customer`,
  headers: {
    "Authorization": "Bearer YOUR_CUSTOMER_JWT_TOKEN_HERE"
  }
};

/**
 * 17. STAFF ROUTE (Staff, Manager, or Admin)
 * GET /api/auth-demo/staff
 */
const staffRoute = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/staff`,
  headers: {
    "Authorization": "Bearer YOUR_STAFF_JWT_TOKEN_HERE"
  }
};

/**
 * 18. MANAGER ROUTE (Manager or Admin)
 * GET /api/auth-demo/manager
 */
const managerRoute = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/manager`,
  headers: {
    "Authorization": "Bearer YOUR_MANAGER_JWT_TOKEN_HERE"
  }
};

/**
 * 19. ADMIN ONLY ROUTE
 * GET /api/auth-demo/admin
 */
const adminOnlyRoute = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/admin`,
  headers: {
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
  }
};

/**
 * 20. PERMISSIONS CHECK
 * GET /api/auth-demo/permissions
 */
const checkPermissions = {
  method: "GET",
  url: `${BASE_URL}/auth-demo/permissions`,
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
};

/**
 * ADMIN ROUTES
 * These require admin or manager role
 */

/**
 * 21. GET ALL USERS (Admin/Manager)
 * GET /api/users?page=1&limit=10&role=customer&search=john&isActive=true&sortBy=createdAt&sortOrder=desc
 */
const getAllUsers = {
  method: "GET",
  url: `${BASE_URL}/users?page=1&limit=10`,
  headers: {
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
  }
};

/**
 * 22. GET USER BY ID (Admin/Manager)
 * GET /api/users/:id
 */
const getUserById = {
  method: "GET",
  url: `${BASE_URL}/users/USER_ID_HERE`,
  headers: {
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
  }
};

/**
 * 23. UPDATE USER (Admin only)
 * PUT /api/users/:id
 */
const updateUser = {
  method: "PUT",
  url: `${BASE_URL}/users/USER_ID_HERE`,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
  },
  body: {
    firstName: "Updated",
    lastName: "Name",
    role: "staff",
    isActive: true
  }
};

/**
 * 24. UPDATE USER STATUS (Admin only)
 * PATCH /api/users/:id/status
 */
const updateUserStatus = {
  method: "PATCH",
  url: `${BASE_URL}/users/USER_ID_HERE/status`,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
  },
  body: {
    isActive: false
  }
};

/**
 * 25. DELETE USER (Admin only)
 * DELETE /api/users/:id
 */
const deleteUser = {
  method: "DELETE",
  url: `${BASE_URL}/users/USER_ID_HERE`,
  headers: {
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
  }
};

/**
 * TESTING WORKFLOW:
 * 
 * 1. Start your server: npm run dev
 * 2. Register a new user (request #1)
 * 3. Login with the user credentials (request #2)
 * 4. Copy the JWT token from the login response
 * 5. Test various protected routes using the token
 * 6. Test role-based access with different user roles
 * 7. Test password reset flow
 * 8. Test email verification flow
 * 
 * ROLE TESTING:
 * - Create users with different roles (customer, staff, manager, admin)
 * - Test each role against the demo routes to see access control in action
 * 
 * ERROR TESTING:
 * - Try accessing protected routes without tokens
 * - Try accessing role-restricted routes with insufficient permissions
 * - Try using expired or invalid tokens
 */

export {
  registerUser,
  loginUser,
  refreshToken,
  checkAuthStatus,
  getUserProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  logoutUser,
  publicRoute,
  optionalAuthRoute,
  protectedRoute,
  customerOnlyRoute,
  staffRoute,
  managerRoute,
  adminOnlyRoute,
  checkPermissions,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser
};
