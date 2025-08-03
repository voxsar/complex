import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Customer } from "../entities/Customer";

export const generateCustomerJWT = (customer: Customer): string => {
  const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

  const payload = {
    _id: customer._id.toString(),
    id: customer.id,
    email: customer.email,
    status: customer.status,
    type: "customer"
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const generateCustomerRefreshToken = (customer: Customer): string => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

  const payload = {
    _id: customer._id.toString(),
    id: customer.id,
    type: "customer_refresh",
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
};

export const verifyCustomerRefreshToken = (token: string): any => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

export const generateCustomerEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateCustomerPasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashCustomerToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Calculate loyalty points based on order amount
export const calculateLoyaltyPoints = (orderAmount: number, customer: Customer): number => {
  const basePoints = Math.floor(orderAmount); // 1 point per dollar
  const multiplier = customer.getLoyaltyMultiplier();
  return Math.floor(basePoints * multiplier);
};

// Loyalty tier benefits
export const getLoyaltyTierBenefits = (tier: string) => {
  const benefits = {
    Bronze: {
      pointsMultiplier: 1.0,
      freeShippingThreshold: 100,
      earlyAccess: false,
      birthdayDiscount: 5,
      returnWindow: 30
    },
    Silver: {
      pointsMultiplier: 1.2,
      freeShippingThreshold: 75,
      earlyAccess: false,
      birthdayDiscount: 10,
      returnWindow: 45
    },
    Gold: {
      pointsMultiplier: 1.5,
      freeShippingThreshold: 50,
      earlyAccess: true,
      birthdayDiscount: 15,
      returnWindow: 60
    },
    Platinum: {
      pointsMultiplier: 2.0,
      freeShippingThreshold: 0,
      earlyAccess: true,
      birthdayDiscount: 20,
      returnWindow: 90
    }
  };

  return benefits[tier as keyof typeof benefits] || benefits.Bronze;
};

// Points redemption values
export const getPointsRedemptionOptions = () => {
  return [
    { points: 100, value: 5, description: "$5 off your order" },
    { points: 250, value: 15, description: "$15 off your order" },
    { points: 500, value: 35, description: "$35 off your order" },
    { points: 1000, value: 75, description: "$75 off your order" },
    { points: 2000, value: 160, description: "$160 off your order" }
  ];
};

export default {
  generateCustomerJWT,
  generateCustomerRefreshToken,
  verifyCustomerRefreshToken,
  generateCustomerEmailVerificationToken,
  generateCustomerPasswordResetToken,
  hashCustomerToken,
  calculateLoyaltyPoints,
  getLoyaltyTierBenefits,
  getPointsRedemptionOptions
};
