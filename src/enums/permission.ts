export enum Permission {
  // User Management
  USER_READ = "user:read",
  USER_WRITE = "user:write",
  USER_DELETE = "user:delete",
  
  // Product Management
  PRODUCT_READ = "product:read",
  PRODUCT_WRITE = "product:write",
  PRODUCT_DELETE = "product:delete",
  
  // Order Management
  ORDER_READ = "order:read",
  ORDER_WRITE = "order:write",
  ORDER_DELETE = "order:delete",
  ORDER_PROCESS = "order:process",
  
  // Customer Management
  CUSTOMER_READ = "customer:read",
  CUSTOMER_WRITE = "customer:write",
  CUSTOMER_DELETE = "customer:delete",
  
  // Inventory Management
  INVENTORY_READ = "inventory:read",
  INVENTORY_WRITE = "inventory:write",
  
  // Shipping Management
  SHIPPING_READ = "shipping:read",
  SHIPPING_WRITE = "shipping:write",
  SHIPPING_DELETE = "shipping:delete",
  
  // Payment Management
  PAYMENT_READ = "payment:read",
  PAYMENT_WRITE = "payment:write",
  PAYMENT_PROCESS = "payment:process",
  
  // Analytics & Reports
  ANALYTICS_READ = "analytics:read",
  REPORTS_READ = "reports:read",
  
  // System Administration
  ADMIN_SETTINGS = "admin:settings",
  ADMIN_USERS = "admin:users",
  ADMIN_ROLES = "admin:roles",
  ADMIN_API_KEYS = "admin:api_keys",
  
  // Marketing
  MARKETING_READ = "marketing:read",
  MARKETING_WRITE = "marketing:write",
  
  // Content Management
  CONTENT_READ = "content:read",
  CONTENT_WRITE = "content:write",
}
