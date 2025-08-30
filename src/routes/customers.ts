import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { Customer } from "../entities/Customer";
import { CustomerStatus } from "../enums/customer_status";
import { validate } from "class-validator";
import { 
  authenticateCustomer, 
  optionalCustomerAuth, 
  requireCustomerEmailVerification,
  customerAuthRateLimit,
  requireLoyaltyTier,
  CustomerAuthRequest 
} from "../middleware/customerAuth";
import {
  generateCustomerJWT,
  generateCustomerRefreshToken,
  verifyCustomerRefreshToken,
  generateCustomerEmailVerificationToken,
  generateCustomerPasswordResetToken,
  hashCustomerToken,
  calculateLoyaltyPoints,
  getLoyaltyTierBenefits,
  getPointsRedemptionOptions
} from "../utils/customerAuth";
import * as bcrypt from "bcryptjs";
import emailService from "../utils/emailService";

const router = Router();

// ===============================
// PUBLIC CUSTOMER AUTH ROUTES
// ===============================

// Customer Registration
router.post("/register", customerAuthRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, dateOfBirth, acceptsMarketing } = req.body;
    const customerRepository = AppDataSource.getRepository(Customer);

    // Check if customer already exists
    const existingCustomer = await customerRepository.findOne({ where: { email } });
    if (existingCustomer) {
      return res.status(400).json({ error: "Customer already exists with this email" });
    }

    // Create new customer
    const customer = customerRepository.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      acceptsMarketing: acceptsMarketing || false,
      status: CustomerStatus.ACTIVE,
      emailVerificationToken: generateCustomerEmailVerificationToken(),
      loyaltyJoinedAt: new Date(),
      preferences: {
        notifications: { email: true, sms: false, push: false },
        marketing: { newsletter: acceptsMarketing || false, promotions: false, newProducts: false },
        privacy: { profileVisible: false, shareData: false },
        language: "en",
        currency: "USD",
        timezone: "UTC"
      }
    });

    // Validate
    const errors = await validate(customer);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await customerRepository.save(customer);

    // Generate tokens
    const token = generateCustomerJWT(customer);
    const refreshToken = generateCustomerRefreshToken(customer);

    res.status(201).json({
      message: "Customer registered successfully",
      customer: customer.toJSON(),
      token,
      refreshToken,
      verificationRequired: !customer.isEmailVerified
    });
  } catch (error) {
    console.error("Error registering customer:", error);
    res.status(500).json({ error: "Failed to register customer" });
  }
});

// Customer Login
router.post("/login", customerAuthRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const customerRepository = AppDataSource.getRepository(Customer);

    // Find customer with password
    const customer = await customerRepository
      .createQueryBuilder("customer")
      .addSelect("customer.password")
      .where("customer.email = :email", { email })
      .getOne();

    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (customer.status !== CustomerStatus.ACTIVE) {
      return res.status(401).json({ error: "Account is not active" });
    }

    // Update last login
    customer.lastLoginAt = new Date();
    await customerRepository.save(customer);

    // Generate tokens
    const token = generateCustomerJWT(customer);
    const refreshToken = generateCustomerRefreshToken(customer);

    res.json({
      message: "Login successful",
      customer: customer.toJSON(),
      token,
      refreshToken,
      loyaltyInfo: {
        currentTier: customer.loyaltyTier,
        points: customer.loyaltyPoints,
        nextTierThreshold: customer.nextTierThreshold,
        benefits: getLoyaltyTierBenefits(customer.loyaltyTier || "Bronze")
      }
    });
  } catch (error) {
    console.error("Error logging in customer:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Refresh Token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = verifyCustomerRefreshToken(refreshToken);
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({ where: { _id: new ObjectId(decoded._id) } });
    if (!customer || customer.status !== CustomerStatus.ACTIVE) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newToken = generateCustomerJWT(customer);
    const newRefreshToken = generateCustomerRefreshToken(customer);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Forgot Password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({ where: { email } });
    if (!customer) {
      // Don't reveal if email exists
      return res.json({ message: "If email exists, reset link will be sent" });
    }

    // Generate reset token
    const resetToken = generateCustomerPasswordResetToken();
    customer.passwordResetToken = hashCustomerToken(resetToken);
    customer.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await customerRepository.save(customer);
    await emailService.sendPasswordReset(customer.email, resetToken);

    res.json({
      message: "Password reset link sent to email"
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Reset Password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const customerRepository = AppDataSource.getRepository(Customer);

    const hashedToken = hashCustomerToken(token);
    const customer = await customerRepository.findOne({
      where: { passwordResetToken: hashedToken }
    });

    if (!customer || !customer.passwordResetExpires || customer.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    // Update password
    customer.password = newPassword;
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;

    await customerRepository.save(customer);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Verify Email
router.get("/verify-email/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { emailVerificationToken: token }
    });

    if (!customer) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    customer.isEmailVerified = true;
    customer.emailVerificationToken = undefined;
    
    // Award welcome bonus points
    customer.addLoyaltyPoints(100);
    
    await customerRepository.save(customer);

    res.json({ 
      message: "Email verified successfully",
      welcomeBonus: 100,
      loyaltyInfo: {
        tier: customer.loyaltyTier,
        points: customer.loyaltyPoints
      }
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// ===============================
// PROTECTED CUSTOMER ROUTES
// ===============================

// Get Customer Profile
router.get("/profile", authenticateCustomer, async (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    customer: customer.toJSON(),
    loyaltyInfo: {
      currentTier: customer.loyaltyTier,
      points: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints,
      nextTierThreshold: customer.nextTierThreshold,
      multiplier: customer.getLoyaltyMultiplier(),
      benefits: getLoyaltyTierBenefits(customer.loyaltyTier || "Bronze")
    },
    availableDiscounts: customer.getAvailableDiscounts(),
    pointsRedemptionOptions: getPointsRedemptionOptions()
  });
});

// Update Customer Profile
router.put("/profile", authenticateCustomer, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const { firstName, lastName, phone, dateOfBirth, preferences } = req.body;

    const customer = await customerRepository.findOne({ where: { _id: req.customer!._id } });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Update allowed fields
    if (firstName) customer.firstName = firstName;
    if (lastName) customer.lastName = lastName;
    if (phone !== undefined) customer.phone = phone;
    if (dateOfBirth) customer.dateOfBirth = new Date(dateOfBirth);
    if (preferences) customer.preferences = { ...customer.preferences, ...preferences };

    const errors = await validate(customer);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await customerRepository.save(customer);
    res.json(customer.toJSON());
  } catch (error) {
    console.error("Error updating customer profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change Password
router.post("/change-password", authenticateCustomer, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository
      .createQueryBuilder("customer")
      .addSelect("customer.password")
      .where("customer._id = :id", { id: req.customer!._id })
      .getOne();

    if (!customer || !(await customer.comparePassword(currentPassword))) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    customer.password = newPassword;
    await customerRepository.save(customer);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Resend Verification Email
router.post("/resend-verification", authenticateCustomer, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({ where: { _id: req.customer!._id } });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (customer.isEmailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    customer.emailVerificationToken = generateCustomerEmailVerificationToken();
    await customerRepository.save(customer);
    await emailService.sendVerification(customer.email, customer.emailVerificationToken!);

    res.json({
      message: "Verification email sent"
    });
  } catch (error) {
    console.error("Error resending verification:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

// ===============================
// LOYALTY & REWARDS ROUTES
// ===============================

// Get Loyalty Dashboard
router.get("/loyalty", authenticateCustomer, async (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    loyaltyProgram: {
      currentTier: customer.loyaltyTier,
      points: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints,
      nextTierThreshold: customer.nextTierThreshold,
      pointsToNextTier: customer.nextTierThreshold ? customer.nextTierThreshold - customer.lifetimePoints : 0,
      multiplier: customer.getLoyaltyMultiplier(),
      joinedAt: customer.loyaltyJoinedAt
    },
    tierBenefits: {
      current: getLoyaltyTierBenefits(customer.loyaltyTier || "Bronze"),
      allTiers: {
        Bronze: getLoyaltyTierBenefits("Bronze"),
        Silver: getLoyaltyTierBenefits("Silver"),
        Gold: getLoyaltyTierBenefits("Gold"),
        Platinum: getLoyaltyTierBenefits("Platinum")
      }
    },
    redemptionOptions: getPointsRedemptionOptions(),
    availableDiscounts: customer.getAvailableDiscounts()
  });
});

// Redeem Loyalty Points
router.post("/loyalty/redeem", authenticateCustomer, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { pointsToRedeem } = req.body;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({ where: { _id: req.customer!._id } });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Validate redemption
    const redemptionOptions = getPointsRedemptionOptions();
    const selectedOption = redemptionOptions.find(option => option.points === pointsToRedeem);
    
    if (!selectedOption) {
      return res.status(400).json({ error: "Invalid redemption amount" });
    }

    if (!customer.redeemLoyaltyPoints(pointsToRedeem)) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    await customerRepository.save(customer);

    // Generate redemption code (in real app, this would be a proper coupon system)
    const redemptionCode = `POINTS${Date.now()}`;

    res.json({
      message: "Points redeemed successfully",
      redemptionCode,
      discount: selectedOption.value,
      pointsRedeemed: pointsToRedeem,
      remainingPoints: customer.loyaltyPoints
    });
  } catch (error) {
    console.error("Error redeeming points:", error);
    res.status(500).json({ error: "Failed to redeem points" });
  }
});

// ===============================
// CUSTOMER ADDRESSES
// ===============================
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const customerRepository = AppDataSource.getRepository(Customer);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
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
    
    // Get customers
    const [customers, total] = await Promise.all([
      customerRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      customerRepository.count({ where: query })
    ]);

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get customer by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Create customer
router.post("/", async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    
    const customer = customerRepository.create(req.body);
    
    // Validate
    const errors = await validate(customer);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedCustomer = await customerRepository.save(customer);
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Update customer
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Update fields
    Object.assign(customer, req.body);
    
    // Validate
    const errors = await validate(customer);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedCustomer = await customerRepository.save(customer);
    res.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Delete customer
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const result = await customerRepository.delete({ id });

    if (result.affected === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Add address to customer
router.post("/:id/addresses", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const address = {
      id: require("uuid").v4(),
      ...req.body,
    };

    if (!customer.addresses) {
      customer.addresses = [];
    }

    customer.addresses.push(address);
    
    const updatedCustomer = await customerRepository.save(customer);
    res.status(201).json(address);
  } catch (error) {
    console.error("Error adding customer address:", error);
    res.status(500).json({ error: "Failed to add customer address" });
  }
});

// Update customer address
router.put("/:id/addresses/:addressId", async (req: Request, res: Response) => {
  try {
    const { id, addressId } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const addressIndex = customer.addresses?.findIndex(a => a.id === addressId);
    
    if (addressIndex === -1 || addressIndex === undefined) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Update address
    customer.addresses![addressIndex] = {
      ...customer.addresses![addressIndex],
      ...req.body,
    };

    await customerRepository.save(customer);
    res.json(customer.addresses![addressIndex]);
  } catch (error) {
    console.error("Error updating customer address:", error);
    res.status(500).json({ error: "Failed to update customer address" });
  }
});

// Delete customer address
router.delete("/:id/addresses/:addressId", async (req: Request, res: Response) => {
  try {
    const { id, addressId } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (!customer.addresses) {
      return res.status(404).json({ error: "Address not found" });
    }

    const initialLength = customer.addresses.length;
    customer.addresses = customer.addresses.filter(a => a.id !== addressId);

    if (customer.addresses.length === initialLength) {
      return res.status(404).json({ error: "Address not found" });
    }

    await customerRepository.save(customer);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer address:", error);
    res.status(500).json({ error: "Failed to delete customer address" });
  }
});

export default router;
