import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { UserRole } from "../enums/user_role";
import { Permission } from "../enums/permission";
import { authenticate, authorize, AuthRequest } from "../middleware/rbac";
import { validate } from "class-validator";
import * as bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting for admin authentication
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 login attempts per IP per window
  message: {
    error: "Too many login attempts, please try again later",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin login
router.post("/login", adminLoginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        code: "MISSING_CREDENTIALS"
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    
    // Find user by email and include password for verification
    const user = await userRepository.findOne({
      where: { email },
      select: ["id", "email", "password", "firstName", "lastName", "role", "isActive", "isEmailVerified", "loginAttempts", "lockedUntil"]
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Check if user is an admin or staff member
    if (!user.isStaff()) {
      return res.status(403).json({
        error: "Admin access required",
        code: "ADMIN_ACCESS_REQUIRED"
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        error: "Account locked due to multiple failed login attempts",
        code: "ACCOUNT_LOCKED"
      });
    }

    // Check if account is active and email verified
    if (!user.isActive) {
      return res.status(401).json({
        error: "Account is inactive",
        code: "ACCOUNT_INACTIVE"
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        error: "Email not verified",
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      user.incLoginAttempts();
      await userRepository.save(user);

      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Successful login - update last login info
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    user.updateLastLogin(clientIP);
    await userRepository.save(user);

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const tokenPayload = {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "24h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id.toString() },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Load user roles for response
    let userRoles: Role[] = [];
    if (user.roleIds.length > 0) {
      const roleRepository = AppDataSource.getRepository(Role);
      userRoles = await roleRepository.find({
        where: {
          id: { $in: user.roleIds } as any,
          isActive: true,
        },
      });
    }

    // Get user permissions
    const permissions = getUserPermissions(user, userRoles);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roles: userRoles.map(role => ({
          id: role.id,
          name: role.name,
          permissions: role.permissions,
        })),
        permissions,
        lastLoginAt: user.lastLoginAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // seconds
      },
    });
  } catch (error) {
    logger.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh admin token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token is required",
        code: "MISSING_REFRESH_TOKEN"
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.id } as any,
      });

      if (!user || !user.isActive || !user.isStaff()) {
        return res.status(401).json({
          error: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN"
        });
      }

      // Generate new access token
      const tokenPayload = {
        id: user.id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });

      res.json({
        accessToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      });
    } catch (jwtError) {
      return res.status(401).json({
        error: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN"
      });
    }
  } catch (error) {
    logger.error("Token refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get admin profile
router.get("/profile", authenticate, authorize([Permission.ADMIN_SETTINGS]), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Load user roles
    let userRoles: Role[] = [];
    if (user.roleIds.length > 0) {
      const roleRepository = AppDataSource.getRepository(Role);
      userRoles = await roleRepository.find({
        where: {
          id: { $in: user.roleIds } as any,
          isActive: true,
        },
      });
    }

    // Get user permissions
    const permissions = getUserPermissions(user, userRoles);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roles: userRoles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        })),
        permissions,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        lastLoginIP: user.lastLoginIP,
        createdAt: user.createdAt,
        preferences: user.preferences,
      },
      authType: req.authType,
      apiKey: req.apiKey ? {
        id: req.apiKey.id,
        name: req.apiKey.name,
        permissions: req.apiKey.permissions,
        lastUsedAt: req.apiKey.lastUsedAt,
      } : null,
    });
  } catch (error) {
    logger.error("Get admin profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update admin profile
router.put("/profile", authenticate, authorize([Permission.ADMIN_SETTINGS]), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { firstName, lastName, preferences } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    // Validate updated user
    const errors = await validate(user);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    await userRepository.save(user);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    logger.error("Update admin profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change admin password
router.post("/change-password", authenticate, authorize([Permission.ADMIN_SETTINGS]), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters long"
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    
    // Get user with password for verification
    const userWithPassword = await userRepository.findOne({
      where: { id: user.id } as any,
      select: ["id", "password"]
    });

    if (!userWithPassword) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: "Current password is incorrect"
      });
    }

    // Hash and update new password
    userWithPassword.password = await bcrypt.hash(newPassword, 12);
    await userRepository.save(userWithPassword);

    res.json({
      message: "Password changed successfully"
    });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin logout (optional endpoint for token blacklisting if implemented)
router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      message: "Logged out successfully"
    });
  } catch (error) {
    logger.error("Admin logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to get user permissions
function getUserPermissions(user: User, roles: Role[]): Permission[] {
  const permissions = new Set<Permission>();

  // Add role-based permissions
  roles.forEach(role => {
    role.permissions.forEach(permission => permissions.add(permission));
  });

  // Add default permissions based on user role (legacy support)
  const defaultPermissions = getDefaultPermissionsByRole(user.role);
  defaultPermissions.forEach(permission => permissions.add(permission));

  return Array.from(permissions);
}

// Get default permissions by user role
function getDefaultPermissionsByRole(role: UserRole): Permission[] {
  switch (role) {
    case UserRole.ADMIN:
      return Object.values(Permission);
      
    case UserRole.MANAGER:
      return [
        Permission.PRODUCT_READ, Permission.PRODUCT_WRITE,
        Permission.ORDER_READ, Permission.ORDER_WRITE, Permission.ORDER_PROCESS,
        Permission.CUSTOMER_READ, Permission.CUSTOMER_WRITE,
        Permission.INVENTORY_READ, Permission.INVENTORY_WRITE,
        Permission.SHIPPING_READ, Permission.SHIPPING_WRITE,
        Permission.PAYMENT_READ, Permission.ANALYTICS_READ, Permission.REPORTS_READ,
        Permission.MARKETING_READ, Permission.MARKETING_WRITE,
      ];
      
    case UserRole.STAFF:
      return [
        Permission.PRODUCT_READ, Permission.ORDER_READ, Permission.ORDER_WRITE,
        Permission.CUSTOMER_READ, Permission.INVENTORY_READ,
        Permission.SHIPPING_READ, Permission.PAYMENT_READ,
      ];
      
    default:
      return [];
  }
}

export default router;
