import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "../data-source";
import { Customer } from "../entities/Customer";
import { CustomerStatus } from "../enums/customer_status";

export interface CustomerAuthRequest extends Request {
  customer?: Customer;
}

interface CustomerJWTPayload {
  _id: string;
  id: string;
  email: string;
  status: string;
  type: string;
  iat?: number;
  exp?: number;
}

export const authenticateCustomer = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from different possible locations
    let token = req.header("Authorization")?.replace("Bearer ", "");
    
    // Also check for token in cookies
    if (!token && req.cookies?.customerToken) {
      token = req.cookies.customerToken;
    }

    if (!token) {
      return res.status(401).json({ 
        error: "Access denied. Please login to continue.",
        code: "NO_TOKEN"
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as CustomerJWTPayload;

    // Validate token payload
    if (!decoded._id || !decoded.id || !decoded.email || decoded.type !== "customer") {
      return res.status(401).json({ 
        error: "Invalid token format.",
        code: "INVALID_TOKEN_FORMAT"
      });
    }

    const customerRepository = AppDataSource.getRepository(Customer);
    const customer = await customerRepository.findOne({
      where: { _id: new ObjectId(decoded._id) },
    });

    if (!customer) {
      return res.status(401).json({ 
        error: "Customer account not found. Token may be invalid.",
        code: "CUSTOMER_NOT_FOUND"
      });
    }

    if (customer.status !== CustomerStatus.ACTIVE) {
      return res.status(401).json({ 
        error: "Account is suspended or inactive.",
        code: "ACCOUNT_INACTIVE"
      });
    }

    // Additional security: check if email in token matches current customer email
    if (customer.email !== decoded.email) {
      return res.status(401).json({ 
        error: "Token validation failed.",
        code: "TOKEN_CUSTOMER_MISMATCH"
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: "Session has expired. Please login again.",
        code: "TOKEN_EXPIRED"
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: "Invalid session token.",
        code: "INVALID_TOKEN"
      });
    } else {
      console.error("Customer authentication error:", error);
      return res.status(500).json({ 
        error: "Authentication failed.",
        code: "AUTH_ERROR"
      });
    }
  }
};

// Optional customer auth (works with or without authentication)
export const optionalCustomerAuth = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token && req.cookies?.customerToken) {
      token = req.cookies.customerToken;
    }

    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        return next();
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as CustomerJWTPayload;

        if (decoded._id && decoded.id && decoded.email && decoded.type === "customer") {
          const customerRepository = AppDataSource.getRepository(Customer);
          const customer = await customerRepository.findOne({
            where: { _id: new ObjectId(decoded._id) },
          });

          if (customer && customer.status === CustomerStatus.ACTIVE && customer.email === decoded.email) {
            req.customer = customer;
          }
        }
      } catch (jwtError) {
        // Silently ignore JWT errors in optional auth
      }
    }

    next();
  } catch (error) {
    console.error("Optional customer auth error:", error);
    next();
  }
};

// Middleware to require email verification for customers
export const requireCustomerEmailVerification = (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.customer) {
    return res.status(401).json({ 
      error: "Authentication required.",
      code: "NOT_AUTHENTICATED"
    });
  }

  if (!req.customer.isEmailVerified) {
    return res.status(403).json({ 
      error: "Please verify your email address to continue.",
      code: "EMAIL_NOT_VERIFIED",
      verificationRequired: true
    });
  }

  next();
};

// Rate limiting for customer auth endpoints
export const customerAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many login attempts. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Customer loyalty tier check middleware
export const requireLoyaltyTier = (...tiers: string[]) => {
  return (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
    if (!req.customer) {
      return res.status(401).json({ 
        error: "Authentication required.",
        code: "NOT_AUTHENTICATED"
      });
    }

    if (!req.customer.loyaltyTier || !tiers.includes(req.customer.loyaltyTier)) {
      return res.status(403).json({ 
        error: "This feature requires a higher loyalty tier.",
        code: "INSUFFICIENT_LOYALTY_TIER",
        currentTier: req.customer.loyaltyTier,
        requiredTiers: tiers
      });
    }

    next();
  };
};

export default {
  authenticateCustomer,
  optionalCustomerAuth,
  requireCustomerEmailVerification,
  customerAuthRateLimit,
  requireLoyaltyTier
};
