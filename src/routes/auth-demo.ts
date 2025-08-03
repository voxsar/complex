import { Router, Request, Response } from "express";
import { authenticate, authorize, optionalAuth, AuthRequest } from "../middleware/auth";
import { UserRole } from "../enums/user_role";

const router = Router();

// Public route (no authentication required)
router.get("/public", (req: Request, res: Response) => {
  res.json({
    message: "This is a public endpoint",
    authenticated: false,
    timestamp: new Date().toISOString(),
  });
});

// Optional auth route (works with or without authentication)
router.get("/optional", optionalAuth, (req: AuthRequest, res: Response) => {
  res.json({
    message: "This endpoint works with optional authentication",
    authenticated: !!req.user,
    user: req.user ? req.user.toJSON() : null,
    timestamp: new Date().toISOString(),
  });
});

// Protected route (requires authentication)
router.get("/protected", authenticate, (req: AuthRequest, res: Response) => {
  res.json({
    message: "This is a protected endpoint - authentication required",
    authenticated: true,
    user: req.user!.toJSON(),
    timestamp: new Date().toISOString(),
  });
});

// Customer only route
router.get("/customer", authenticate, authorize(UserRole.CUSTOMER), (req: AuthRequest, res: Response) => {
  res.json({
    message: "This endpoint is for customers only",
    authenticated: true,
    user: req.user!.toJSON(),
    role: req.user!.role,
    timestamp: new Date().toISOString(),
  });
});

// Staff or higher route
router.get("/staff", authenticate, authorize(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN), (req: AuthRequest, res: Response) => {
  res.json({
    message: "This endpoint is for staff, managers, and admins",
    authenticated: true,
    user: req.user!.toJSON(),
    role: req.user!.role,
    timestamp: new Date().toISOString(),
  });
});

// Manager or admin only route
router.get("/manager", authenticate, authorize(UserRole.MANAGER, UserRole.ADMIN), (req: AuthRequest, res: Response) => {
  res.json({
    message: "This endpoint is for managers and admins only",
    authenticated: true,
    user: req.user!.toJSON(),
    role: req.user!.role,
    timestamp: new Date().toISOString(),
  });
});

// Admin only route
router.get("/admin", authenticate, authorize(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
  res.json({
    message: "This endpoint is for admins only",
    authenticated: true,
    user: req.user!.toJSON(),
    role: req.user!.role,
    timestamp: new Date().toISOString(),
  });
});

// Route to test all permission levels
router.get("/permissions", authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  
  res.json({
    message: "Your current permissions and access levels",
    authenticated: true,
    user: user.toJSON(),
    permissions: {
      isAdmin: user.role === UserRole.ADMIN,
      isManager: user.role === UserRole.MANAGER || user.role === UserRole.ADMIN,
      isStaff: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN].includes(user.role),
      isCustomer: user.role === UserRole.CUSTOMER,
    },
    accessLevels: {
      canAccessPublic: true,
      canAccessOptional: true,
      canAccessProtected: true,
      canAccessCustomer: user.role === UserRole.CUSTOMER,
      canAccessStaff: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN].includes(user.role),
      canAccessManager: [UserRole.MANAGER, UserRole.ADMIN].includes(user.role),
      canAccessAdmin: user.role === UserRole.ADMIN,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
