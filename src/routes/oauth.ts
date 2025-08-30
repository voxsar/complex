import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { OAuthAccount } from "../entities/OAuthAccount";
import { OAuthProvider } from "../enums/oauth_provider";
import { UserRole } from "../enums/user_role";
import { authenticate, AuthRequest } from "../middleware/rbac";
import { validate } from "class-validator";
import { Not } from "typeorm";
import axios from "axios";
import crypto from "crypto";

const router = Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// OAuth state store (in production, use Redis or database)
const oauthStates = new Map<string, { provider: OAuthProvider; redirectUrl?: string; expiresAt: number }>();

// Cleanup expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Generate OAuth state parameter for CSRF protection
 */
function generateOAuthState(provider: OAuthProvider, redirectUrl?: string): string {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, {
    provider,
    redirectUrl,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
  return state;
}

/**
 * Verify OAuth state parameter
 */
function verifyOAuthState(state: string, provider: OAuthProvider): boolean {
  const stateData = oauthStates.get(state);
  if (!stateData || stateData.provider !== provider || stateData.expiresAt < Date.now()) {
    return false;
  }
  oauthStates.delete(state);
  return true;
}

/**
 * Google OAuth configuration
 */
const getGoogleOAuthUrl = (state: string, redirectUrl?: string): string => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Facebook OAuth configuration
 */
const getFacebookOAuthUrl = (state: string, redirectUrl?: string): string => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
    response_type: 'code',
    scope: 'email,public_profile',
    state
  });
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
};

/**
 * GitHub OAuth configuration
 */
const getGitHubOAuthUrl = (state: string, redirectUrl?: string): string => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: 'user:email',
    state
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

// Initiate OAuth login
router.get("/login/:provider", async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { redirectUrl } = req.query;

    // Validate provider
    const providerEnum = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerEnum)) {
      return res.status(400).json({
        error: "Unsupported OAuth provider",
        code: "INVALID_PROVIDER"
      });
    }

    // Generate state for CSRF protection
    const state = generateOAuthState(providerEnum, redirectUrl as string);

    let authUrl: string;
    switch (providerEnum) {
      case OAuthProvider.GOOGLE:
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
          return res.status(500).json({
            error: "Google OAuth not configured",
            code: "OAUTH_NOT_CONFIGURED"
          });
        }
        authUrl = getGoogleOAuthUrl(state, redirectUrl as string);
        break;

      case OAuthProvider.FACEBOOK:
        if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_REDIRECT_URI) {
          return res.status(500).json({
            error: "Facebook OAuth not configured",
            code: "OAUTH_NOT_CONFIGURED"
          });
        }
        authUrl = getFacebookOAuthUrl(state, redirectUrl as string);
        break;

      case OAuthProvider.GITHUB:
        if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_REDIRECT_URI) {
          return res.status(500).json({
            error: "GitHub OAuth not configured",
            code: "OAUTH_NOT_CONFIGURED"
          });
        }
        authUrl = getGitHubOAuthUrl(state, redirectUrl as string);
        break;

      default:
        return res.status(400).json({
          error: "Unsupported OAuth provider",
          code: "INVALID_PROVIDER"
        });
    }

    res.json({
      authUrl,
      state,
      provider: providerEnum
    });

  } catch (error) {
    logger.error("OAuth initiation error:", error);
    res.status(500).json({
      error: "Failed to initiate OAuth",
      code: "OAUTH_INITIATION_ERROR"
    });
  }
});

// OAuth callback handler
router.post("/callback/:provider", async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({
        error: "Authorization code and state are required",
        code: "MISSING_OAUTH_PARAMS"
      });
    }

    const providerEnum = provider.toUpperCase() as OAuthProvider;

    // Verify state parameter
    if (!verifyOAuthState(state, providerEnum)) {
      return res.status(400).json({
        error: "Invalid or expired OAuth state",
        code: "INVALID_OAUTH_STATE"
      });
    }

    let userInfo: any;
    let accessToken: string;

    // Exchange code for access token and get user info
    switch (providerEnum) {
      case OAuthProvider.GOOGLE:
        const googleTokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_REDIRECT_URI
        });

        accessToken = (googleTokenResponse.data as any).access_token;
        
        const googleUserResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const googleData = googleUserResponse.data as any;
        userInfo = {
          id: googleData.id,
          email: googleData.email,
          firstName: googleData.given_name,
          lastName: googleData.family_name,
          picture: googleData.picture,
          emailVerified: googleData.verified_email
        };
        break;

      case OAuthProvider.FACEBOOK:
        const facebookTokenResponse = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          code,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI
        });

        accessToken = (facebookTokenResponse.data as any).access_token;
        
        const facebookUserResponse = await axios.get(`https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`);

        const facebookData = facebookUserResponse.data as any;
        userInfo = {
          id: facebookData.id,
          email: facebookData.email,
          firstName: facebookData.first_name,
          lastName: facebookData.last_name,
          picture: facebookData.picture?.data?.url,
          emailVerified: true // Facebook emails are generally verified
        };
        break;

      case OAuthProvider.GITHUB:
        const githubTokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        }, {
          headers: { Accept: 'application/json' }
        });

        accessToken = (githubTokenResponse.data as any).access_token;
        
        const githubUserResponse = await axios.get('https://api.github.com/user', {
          headers: { Authorization: `token ${accessToken}` }
        });

        const githubEmailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `token ${accessToken}` }
        });

        const githubData = githubUserResponse.data as any;
        const githubEmails = githubEmailsResponse.data as any[];
        const primaryEmail = githubEmails.find((email: any) => email.primary);

        userInfo = {
          id: githubData.id.toString(),
          email: primaryEmail?.email || githubData.email,
          firstName: githubData.name?.split(' ')[0] || githubData.login,
          lastName: githubData.name?.split(' ').slice(1).join(' ') || '',
          picture: githubData.avatar_url,
          emailVerified: primaryEmail?.verified || false
        };
        break;

      default:
        return res.status(400).json({
          error: "Unsupported OAuth provider",
          code: "INVALID_PROVIDER"
        });
    }

    if (!userInfo.email) {
      return res.status(400).json({
        error: "Email not provided by OAuth provider",
        code: "NO_EMAIL_PROVIDED"
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const oauthRepository = AppDataSource.getRepository(OAuthAccount);

    // Check if OAuth account already exists
    let oauthAccount = await oauthRepository.findOne({
      where: {
        provider: providerEnum,
        providerId: userInfo.id
      },
      relations: ["user"]
    });

    let user: User;

    if (oauthAccount) {
      // Existing OAuth account
      user = oauthAccount.user;
      
      // Update OAuth account with latest info
      oauthAccount.accessToken = accessToken;
      oauthAccount.lastLoginAt = new Date();
      await oauthRepository.save(oauthAccount);

      // Update user info if needed
      if (!user.firstName && userInfo.firstName) user.firstName = userInfo.firstName;
      if (!user.lastName && userInfo.lastName) user.lastName = userInfo.lastName;
      if (!user.profilePictureUrl && userInfo.picture) user.profilePictureUrl = userInfo.picture;
      
      await userRepository.save(user);
    } else {
      // Check if user exists with this email
      user = await userRepository.findOne({ where: { email: userInfo.email } });

      if (user) {
        // Link existing user to OAuth account
        oauthAccount = new OAuthAccount();
        oauthAccount.user = user;
        oauthAccount.userId = user.id.toString();
        oauthAccount.provider = providerEnum;
        oauthAccount.providerId = userInfo.id;
        oauthAccount.accessToken = accessToken;
        oauthAccount.email = userInfo.email;
        oauthAccount.lastLoginAt = new Date();

        await oauthRepository.save(oauthAccount);
      } else {
        // Create new user
        user = new User();
        user.email = userInfo.email;
        user.firstName = userInfo.firstName || '';
        user.lastName = userInfo.lastName || '';
        user.role = UserRole.CUSTOMER;
        user.isActive = true;
        user.isEmailVerified = userInfo.emailVerified || false;
        user.profilePictureUrl = userInfo.picture;
        user.lastLoginAt = new Date();
        user.lastLoginIP = req.ip || req.connection.remoteAddress || 'unknown';

        // No password for OAuth users
        user.password = crypto.randomBytes(32).toString('hex'); // Random password they can't use

        const errors = await validate(user);
        if (errors.length > 0) {
          return res.status(400).json({
            error: "Invalid user data",
            details: errors.map(error => ({
              field: error.property,
              constraints: error.constraints
            }))
          });
        }

        await userRepository.save(user);

        // Create OAuth account
        oauthAccount = new OAuthAccount();
        oauthAccount.user = user;
        oauthAccount.userId = user.id.toString();
        oauthAccount.provider = providerEnum;
        oauthAccount.providerId = userInfo.id;
        oauthAccount.accessToken = accessToken;
        oauthAccount.email = userInfo.email;
        oauthAccount.lastLoginAt = new Date();

        await oauthRepository.save(oauthAccount);
      }
    }

    // Update user's last login
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    user.updateLastLogin(clientIP);
    await userRepository.save(user);

    // Generate JWT token
    const tokenPayload = {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      authMethod: 'oauth',
      provider: providerEnum
    };

    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id.toString(), type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "OAuth login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt
      },
      oauth: {
        provider: providerEnum,
        isNewUser: !oauthAccount || !user.lastLoginAt
      }
    });

  } catch (error) {
    logger.error("OAuth callback error:", error);
    res.status(500).json({
      error: "OAuth authentication failed",
      code: "OAUTH_CALLBACK_ERROR"
    });
  }
});

// Unlink OAuth account (requires authentication)
router.delete("/unlink/:provider", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { provider } = req.params;
    const userId = req.user!.id.toString(); // Convert ObjectId to string

    const providerEnum = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerEnum)) {
      return res.status(400).json({
        error: "Invalid OAuth provider",
        code: "INVALID_PROVIDER"
      });
    }

    const oauthRepository = AppDataSource.getRepository(OAuthAccount);
    const userRepository = AppDataSource.getRepository(User);

    // Find OAuth account
    const oauthAccount = await oauthRepository.findOne({
      where: {
        userId: userId,
        provider: providerEnum
      }
    });

    if (!oauthAccount) {
      return res.status(404).json({
        error: "OAuth account not found",
        code: "OAUTH_ACCOUNT_NOT_FOUND"
      });
    }

    // Check if user has a password or other OAuth accounts
    const user = await userRepository.findOne({ where: { id: req.user!.id } });
    const otherOAuthAccounts = await oauthRepository.count({
      where: {
        userId: userId,
        provider: Not(providerEnum) // TypeORM syntax for NOT equal
      }
    });

    if (!user?.password && otherOAuthAccounts === 0) {
      return res.status(400).json({
        error: "Cannot unlink last authentication method. Please set a password first.",
        code: "LAST_AUTH_METHOD"
      });
    }

    // Remove OAuth account
    await oauthRepository.remove(oauthAccount);

    res.json({
      message: "OAuth account unlinked successfully",
      provider: providerEnum
    });

  } catch (error) {
    logger.error("OAuth unlink error:", error);
    res.status(500).json({
      error: "Failed to unlink OAuth account",
      code: "OAUTH_UNLINK_ERROR"
    });
  }
});

// Get linked OAuth accounts (requires authentication)
router.get("/accounts", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id.toString(); // Convert ObjectId to string

    const oauthRepository = AppDataSource.getRepository(OAuthAccount);
    const oauthAccounts = await oauthRepository.find({
      where: { userId: userId },
      select: ["id", "provider", "email", "createdAt", "lastLoginAt"]
    });

    res.json({
      accounts: oauthAccounts.map(account => ({
        id: account.id,
        provider: account.provider,
        email: account.email,
        linkedAt: account.createdAt,
        lastUsed: account.lastLoginAt
      }))
    });

  } catch (error) {
    logger.error("Get OAuth accounts error:", error);
    res.status(500).json({
      error: "Failed to get OAuth accounts",
      code: "GET_OAUTH_ACCOUNTS_ERROR"
    });
  }
});

export default router;
