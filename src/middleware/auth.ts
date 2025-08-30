import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { UserRole } from "../enums/user_role";

export interface AuthRequest extends Request {
  user?: User;
}

interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from different possible locations
    let token = req.header("Authorization")?.replace("Bearer ", "");

    // Also check for token in cookies (if you're using cookie-based auth)
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

    // Validate token payload
    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        error: "Invalid token format.",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: new ObjectId(decoded.id) },
      select: [
        "id",
        "email",
        "firstName",
        "lastName",
        "role",
        "isActive",
        "isEmailVerified",
      ],
    });

    if (!user) {
      return res.status(401).json({
        error: "User not found. Token may be invalid.",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: "Account is deactivated.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Additional security: check if email in token matches current user email
    if (user.email !== decoded.email) {
      return res.status(401).json({
        error: "Token validation failed.",
        code: "TOKEN_USER_MISMATCH",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "Token has expired.",
        code: "TOKEN_EXPIRED",
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: "Invalid token.",
        code: "INVALID_TOKEN",
      });
    } else {
      logger.error("Authentication error:", error);
      return res.status(500).json({
        error: "Authentication failed.",
        code: "AUTH_ERROR",
      });
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Access denied. Authentication required.",
        code: "NOT_AUTHENTICATED",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions.",
        code: "INSUFFICIENT_PERMISSIONS",
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.header("Authorization")?.replace("Bearer ", "");

    // Also check for token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        logger.error("JWT_SECRET is not configured");
        // Continue without authentication if JWT_SECRET is not configured
        return next();
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        if (decoded.id && decoded.email && decoded.role) {
          const userRepository = AppDataSource.getRepository(User);
          const user = await userRepository.findOne({
            where: { id: new ObjectId(decoded.id) },
            select: [
              "id",
              "email",
              "firstName",
              "lastName",
              "role",
              "isActive",
              "isEmailVerified",
            ],
          });

          if (user && user.isActive && user.email === decoded.email) {
            req.user = user;
          }
        }
      } catch (jwtError) {
        // Silently ignore JWT errors in optional auth
        // This allows the request to continue without authentication
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if any error occurs
    logger.error("Optional auth error:", error);
    next();
  }
};

// Middleware to require email verification
export const requireEmailVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
      code: "NOT_AUTHENTICATED",
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      error: "Email verification required.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

// Rate limiting middleware for auth routes
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: "Too many authentication attempts, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to log authentication events
export const logAuthEvents = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.json;

  res.json = function (data: any) {
    // Log successful authentications
    if (req.user && res.statusCode === 200) {
      logger.info(
        `Auth success: ${req.user.email} - ${req.method} ${req.path}`
      );
    }
    // Log failed authentications
    else if (res.statusCode === 401 || res.statusCode === 403) {
      logger.info(
        `Auth failed: ${req.ip} - ${req.method} ${req.path} - ${res.statusCode}`
      );
    }

    return originalSend.call(this, data);
  };

  next();
};
