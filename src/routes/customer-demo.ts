import { Router, Request, Response } from "express";
import { 
  authenticateCustomer, 
  optionalCustomerAuth, 
  requireCustomerEmailVerification,
  requireLoyaltyTier,
  CustomerAuthRequest 
} from "../middleware/customerAuth";

const router = Router();

// Public route (no authentication required)
router.get("/public", (req: Request, res: Response) => {
  res.json({
    message: "This is a public customer endpoint",
    authenticated: false,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "POST /api/customers/register - Register new customer",
      "POST /api/customers/login - Customer login",
      "GET /api/customer-demo/public - This endpoint",
      "GET /api/customer-demo/optional - Optional auth endpoint",
    ]
  });
});

// Optional auth route (works with or without authentication)
router.get("/optional", optionalCustomerAuth, (req: CustomerAuthRequest, res: Response) => {
  res.json({
    message: "This endpoint works with optional customer authentication",
    authenticated: !!req.customer,
    customer: req.customer ? {
      id: req.customer.id,
      email: req.customer.email,
      fullName: req.customer.fullName,
      loyaltyTier: req.customer.loyaltyTier,
      loyaltyPoints: req.customer.loyaltyPoints
    } : null,
    timestamp: new Date().toISOString(),
    tip: req.customer ? 
      "You are authenticated! Try the protected endpoints." : 
      "Login as a customer to see personalized content."
  });
});

// Protected route (requires customer authentication)
router.get("/protected", authenticateCustomer, (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    message: "This is a protected customer endpoint - authentication required",
    authenticated: true,
    customer: {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      loyaltyTier: customer.loyaltyTier,
      loyaltyPoints: customer.loyaltyPoints,
      isEmailVerified: customer.isEmailVerified,
      totalSpent: customer.totalSpent,
      ordersCount: customer.ordersCount
    },
    loyaltyInfo: {
      currentTier: customer.loyaltyTier,
      points: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints,
      multiplier: customer.getLoyaltyMultiplier(),
      nextTierThreshold: customer.nextTierThreshold
    },
    availableDiscounts: customer.getAvailableDiscounts(),
    timestamp: new Date().toISOString()
  });
});

// Requires email verification
router.get("/verified-only", authenticateCustomer, requireCustomerEmailVerification, (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    message: "This endpoint requires email verification",
    customer: {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      isEmailVerified: customer.isEmailVerified,
      loyaltyTier: customer.loyaltyTier
    },
    exclusiveContent: {
      message: "Congratulations! You have access to verified-only content.",
      specialOffers: [
        "Exclusive email-verified customer discounts",
        "Early access to new products",
        "Priority customer support"
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Silver tier and above only
router.get("/silver-plus", authenticateCustomer, requireLoyaltyTier("Silver", "Gold", "Platinum"), (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    message: "This endpoint is for Silver+ loyalty members only",
    customer: {
      fullName: customer.fullName,
      loyaltyTier: customer.loyaltyTier,
      loyaltyPoints: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints
    },
    silverPlusBenefits: {
      message: "Welcome to our Silver+ exclusive area!",
      benefits: [
        "Enhanced points multiplier",
        "Lower free shipping threshold",
        "Extended return window",
        "Priority customer service"
      ],
      currentMultiplier: customer.getLoyaltyMultiplier()
    },
    timestamp: new Date().toISOString()
  });
});

// Gold tier and above only
router.get("/gold-plus", authenticateCustomer, requireLoyaltyTier("Gold", "Platinum"), (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    message: "This endpoint is for Gold+ loyalty members only",
    customer: {
      fullName: customer.fullName,
      loyaltyTier: customer.loyaltyTier,
      loyaltyPoints: customer.loyaltyPoints
    },
    goldPlusBenefits: {
      message: "Welcome to our Gold+ VIP area!",
      benefits: [
        "Early access to sales and new products",
        "VIP customer support line",
        "Exclusive product previews",
        "Special birthday month perks"
      ],
      vipStatus: true
    },
    timestamp: new Date().toISOString()
  });
});

// Platinum tier only
router.get("/platinum", authenticateCustomer, requireLoyaltyTier("Platinum"), (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    message: "This endpoint is for Platinum loyalty members only",
    customer: {
      fullName: customer.fullName,
      loyaltyTier: customer.loyaltyTier,
      loyaltyPoints: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints
    },
    platinumBenefits: {
      message: "Welcome to our most exclusive Platinum tier!",
      benefits: [
        "Always free shipping",
        "Highest points multiplier (2.0x)",
        "90-day return window",
        "Personal shopping assistant",
        "Exclusive Platinum-only products",
        "Annual loyalty rewards"
      ],
      exclusiveAccess: true,
      personalizedService: true
    },
    timestamp: new Date().toISOString()
  });
});

// Customer permissions overview
router.get("/permissions", authenticateCustomer, (req: CustomerAuthRequest, res: Response) => {
  const customer = req.customer!;
  
  res.json({
    message: "Your current customer permissions and access levels",
    authenticated: true,
    customer: {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      loyaltyTier: customer.loyaltyTier || "Bronze",
      isEmailVerified: customer.isEmailVerified
    },
    accessLevels: {
      canAccessPublic: true,
      canAccessOptional: true,
      canAccessProtected: true,
      canAccessVerifiedOnly: customer.isEmailVerified,
      canAccessSilverPlus: ["Silver", "Gold", "Platinum"].includes(customer.loyaltyTier || ""),
      canAccessGoldPlus: ["Gold", "Platinum"].includes(customer.loyaltyTier || ""),
      canAccessPlatinum: customer.loyaltyTier === "Platinum"
    },
    loyaltyProgram: {
      currentTier: customer.loyaltyTier || "Bronze",
      points: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints,
      multiplier: customer.getLoyaltyMultiplier(),
      nextTierThreshold: customer.nextTierThreshold,
      pointsToNextTier: customer.nextTierThreshold ? customer.nextTierThreshold - customer.lifetimePoints : 0
    },
    availableEndpoints: {
      alwaysAccess: [
        "GET /api/customer-demo/public",
        "GET /api/customer-demo/optional",
        "GET /api/customer-demo/protected",
        "GET /api/customer-demo/permissions"
      ],
      conditionalAccess: [
        {
          endpoint: "GET /api/customer-demo/verified-only",
          required: "Email verification",
          hasAccess: customer.isEmailVerified
        },
        {
          endpoint: "GET /api/customer-demo/silver-plus",
          required: "Silver+ loyalty tier",
          hasAccess: ["Silver", "Gold", "Platinum"].includes(customer.loyaltyTier || "")
        },
        {
          endpoint: "GET /api/customer-demo/gold-plus",
          required: "Gold+ loyalty tier",
          hasAccess: ["Gold", "Platinum"].includes(customer.loyaltyTier || "")
        },
        {
          endpoint: "GET /api/customer-demo/platinum",
          required: "Platinum loyalty tier",
          hasAccess: customer.loyaltyTier === "Platinum"
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
