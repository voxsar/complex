import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { ApiKey } from "../entities/ApiKey";
import { UserRole } from "../enums/user_role";
import { Permission } from "../enums/permission";

export interface AuthRequest extends Request {
  user?: User;
  userRoles?: Role[];
  apiKey?: ApiKey;
  authType?: 'jwt' | 'api_key';
}

interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Enhanced authentication middleware supporting both JWT and API keys
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for API key first
    const apiKeyHeader = req.header("X-API-Key");
    if (apiKeyHeader) {
      return await authenticateApiKey(req, res, next, apiKeyHeader);
    }

    // Fallback to JWT authentication
    return await authenticateJWT(req, res, next);
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication service error" });
  }
};

// JWT-based authentication
const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      logger.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded.id || !decoded.email) {
      return res.status(401).json({
        error: "Invalid token payload",
        code: "INVALID_TOKEN",
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: new ObjectId(decoded.id) } as any,
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "User not found or inactive",
        code: "USER_NOT_FOUND",
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        error: "Account locked due to multiple failed login attempts",
        code: "ACCOUNT_LOCKED",
      });
    }

    // Load user roles if any
    if (user.roleIds.length > 0) {
      const roleRepository = AppDataSource.getRepository(Role);
      const roles = await roleRepository.find({
        where: {
          id: { $in: user.roleIds } as any,
          isActive: true,
        },
      });
      req.userRoles = roles;
    }

    req.user = user;
    req.authType = 'jwt';
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    throw error;
  }
};

// API key-based authentication
const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  apiKeyValue: string
) => {
  try {
    if (!apiKeyValue.startsWith('ak_')) {
      return res.status(401).json({
        error: "Invalid API key format",
        code: "INVALID_API_KEY_FORMAT",
      });
    }

    const keyPrefix = apiKeyValue.substring(0, 8);
    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    const apiKey = await apiKeyRepository.findOne({
      where: { keyPrefix },
    });

    if (!apiKey) {
      return res.status(401).json({
        error: "Invalid API key",
        code: "INVALID_API_KEY",
      });
    }

    if (!apiKey.verifyKey(apiKeyValue)) {
      return res.status(401).json({
        error: "Invalid API key",
        code: "INVALID_API_KEY",
      });
    }

    if (!apiKey.isValid()) {
      return res.status(401).json({
        error: "API key is not valid (inactive, suspended, or expired)",
        code: "API_KEY_INVALID",
      });
    }

    // Check IP restrictions
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (!apiKey.isIPAllowed(clientIP)) {
      return res.status(403).json({
        error: "API key not allowed from this IP address",
        code: "IP_NOT_ALLOWED",
      });
    }

    // Get the user associated with the API key
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: new ObjectId(apiKey.userId) } as any,
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "User associated with API key not found or inactive",
        code: "USER_NOT_FOUND",
      });
    }

    // Update API key usage
    apiKey.updateUsage(clientIP);
    await apiKeyRepository.save(apiKey);

    req.user = user;
    req.apiKey = apiKey;
    req.authType = 'api_key';
    next();
  } catch (error) {
    logger.error("API Key authentication error:", error);
    return res.status(500).json({ error: "API key authentication service error" });
  }
};

// Authorization middleware for role-based access control
export const authorize = (requiredPermissions: Permission | Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "NOT_AUTHENTICATED",
        });
      }

      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Admin users have all permissions
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Check API key permissions if using API key auth
      if (req.authType === 'api_key' && req.apiKey) {
        const hasPermission = permissions.some(permission => 
          req.apiKey!.permissions.includes(permission)
        );
        
        if (!hasPermission) {
          return res.status(403).json({
            error: "API key does not have required permissions",
            code: "INSUFFICIENT_API_PERMISSIONS",
            requiredPermissions: permissions,
          });
        }
        
        return next();
      }

      // Check user role permissions
      if (req.userRoles && req.userRoles.length > 0) {
        const hasPermission = req.userRoles.some(role => 
          permissions.some(permission => role.hasPermission(permission))
        );
        
        if (hasPermission) {
          return next();
        }
      }

      // Check basic role-based permissions for legacy compatibility
      const userPermissions = getUserPermissionsByRole(req.user.role);
      const hasLegacyPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (hasLegacyPermission) {
        return next();
      }

      return res.status(403).json({
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        requiredPermissions: permissions,
        userRole: req.user.role,
      });
    } catch (error) {
      logger.error("Authorization error:", error);
      return res.status(500).json({ error: "Authorization service error" });
    }
  };
};

// Get default permissions by user role (for legacy compatibility)
function getUserPermissionsByRole(role: UserRole): Permission[] {
  switch (role) {
    case UserRole.ADMIN:
      return Object.values(Permission); // All permissions
      
    case UserRole.MANAGER:
      return [
        Permission.PRODUCT_READ,
        Permission.PRODUCT_WRITE,
        Permission.ORDER_READ,
        Permission.ORDER_WRITE,
        Permission.ORDER_PROCESS,
        Permission.CUSTOMER_READ,
        Permission.CUSTOMER_WRITE,
        Permission.INVENTORY_READ,
        Permission.INVENTORY_WRITE,
        Permission.SHIPPING_READ,
        Permission.SHIPPING_WRITE,
        Permission.PAYMENT_READ,
        Permission.ANALYTICS_READ,
        Permission.REPORTS_READ,
        Permission.MARKETING_READ,
        Permission.MARKETING_WRITE,
      ];
      
    case UserRole.STAFF:
      return [
        Permission.PRODUCT_READ,
        Permission.ORDER_READ,
        Permission.ORDER_WRITE,
        Permission.CUSTOMER_READ,
        Permission.INVENTORY_READ,
        Permission.SHIPPING_READ,
        Permission.PAYMENT_READ,
      ];
      
    case UserRole.CUSTOMER:
      return []; // Customers have no admin permissions
      
    default:
      return [];
  }
}

// Middleware to require admin role
export const requireAdmin = authorize([Permission.ADMIN_SETTINGS]);

// Middleware to require staff role or higher
export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "NOT_AUTHENTICATED",
    });
  }

  if (!req.user.isStaff()) {
    return res.status(403).json({
      error: "Staff access required",
      code: "STAFF_ACCESS_REQUIRED",
    });
  }

  next();
};

// Optional authentication (doesn't fail if no auth provided)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const apiKey = req.header("X-API-Key");

    if (!token && !apiKey) {
      return next(); // No auth provided, continue without user
    }

    // Try to authenticate but don't fail if it doesn't work
    await authenticate(req, res, (error) => {
      if (error) {
        // Log the error but don't fail the request
        logger.warn("Optional auth failed:", error);
      }
      next();
    });
  } catch (error) {
    // Log error but don't fail
    logger.warn("Optional auth error:", error);
    next();
  }
};
