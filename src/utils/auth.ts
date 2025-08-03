import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../entities/User";

export const generateJWT = (user: User): string => {
  const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const generateRefreshToken = (user: User): string => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

  return jwt.sign(
    {
      id: user.id.toString(),
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

export const verifyRefreshToken = (token: string): any => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
