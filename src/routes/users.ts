import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { UserRole } from "../enums/user_role";
import { validate } from "class-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import {
  generateJWT,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken,
} from "../utils/auth";
import * as bcrypt from "bcryptjs";
import emailService from "../utils/emailService";

const router = Router();

// Public routes
// Register new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Create new user
    const user = userRepository.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: UserRole.CUSTOMER,
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: generateEmailVerificationToken(),
    });

    // Validate
    const errors = await validate(user);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await userRepository.save(user);

    // Generate tokens
    const token = generateJWT(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Find user with password - MongoDB compatible query
    const user = await userRepository.findOne({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        lastLoginIP: true,
        loginAttempts: true,
        lockedUntil: true
      }
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await userRepository.save(user);

    // Generate tokens
    const token = generateJWT(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Refresh token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: new ObjectId(decoded.id) } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newToken = generateJWT(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Forgot password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: "If email exists, reset link will be sent" });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userRepository.save(user);
    await emailService.sendPasswordReset(user.email, resetToken);

    res.json({
      message: "Password reset link sent to email"
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Reset password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const hashedToken = hashToken(token);
    const user = await userRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
      },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await userRepository.save(user);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Verify email
router.get("/verify-email/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await userRepository.save(user);

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// Resend verification email
router.post("/resend-verification", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Generate new verification token
    user.emailVerificationToken = generateEmailVerificationToken();
    await userRepository.save(user);
    await emailService.sendVerification(user.email, user.emailVerificationToken!);

    res.json({
      message: "Verification email sent"
    });
  } catch (error) {
    console.error("Error resending verification:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

// Check auth status
router.get("/auth/status", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user!.id },
      select: ["id", "email", "firstName", "lastName", "role", "isActive", "isEmailVerified", "lastLoginAt", "createdAt"]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      authenticated: true,
      user: user.toJSON(),
      permissions: {
        isAdmin: user.role === UserRole.ADMIN,
        isManager: user.role === UserRole.MANAGER,
        isStaff: user.role === UserRole.STAFF,
        isCustomer: user.role === UserRole.CUSTOMER,
      }
    });
  } catch (error) {
    console.error("Error checking auth status:", error);
    res.status(500).json({ error: "Failed to check auth status" });
  }
});

// Logout (invalidate token - for now just return success)
router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // In a more advanced implementation, you might want to:
    // 1. Add token to a blacklist
    // 2. Store tokens in Redis and remove them
    // 3. Use shorter token expiration times
    
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// Protected routes (require authentication)
router.get("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

// Update current user profile
router.put("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { firstName, lastName, phone, preferences } = req.body;

    const user = await userRepository.findOne({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (preferences) user.preferences = preferences;

    const errors = await validate(user);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await userRepository.save(user);
    res.json(user.toJSON());
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
router.post("/change-password", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id: req.user!.id })
      .getOne();

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await userRepository.save(user);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Admin routes (require admin role)
// Get all users (admin only)
router.get("/", authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const userRepository = AppDataSource.getRepository(User);
    
    // Build MongoDB query
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get users
    const [users, total] = await Promise.all([
      userRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      userRepository.count({ where: query })
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID (admin only)
router.get("/:id", authenticate, authorize(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: new ObjectId(id) } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user (admin only)
router.put("/:id", authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: new ObjectId(id) } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields
    Object.assign(user, req.body);
    
    // Don't allow password changes through this endpoint
    delete (user as any).password;
    
    const errors = await validate(user);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedUser = await userRepository.save(user);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Deactivate/activate user (admin only)
router.patch("/:id/status", authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: new ObjectId(id) } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isActive = isActive;
    await userRepository.save(user);

    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// Delete user (admin only)
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const result = await userRepository.delete({ id: new ObjectId(id) });

    if (result.affected === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
