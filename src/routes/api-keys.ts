import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ApiKey } from "../entities/ApiKey";
import { User } from "../entities/User";
import { Permission } from "../enums/permission";
import { ApiKeyStatus } from "../enums/api_key_status";
import { authenticate, authorize, AuthRequest } from "../middleware/rbac";
import { validate } from "class-validator";

const router = Router();

// Get all API keys for current user
router.get("/", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    // Build query
    const query: any = {};
    
    // For non-admin users, only show their own keys
    if (req.user!.role !== "admin") {
      query.userId = req.user!.id.toString();
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [apiKeys, total] = await Promise.all([
      apiKeyRepository.find({
        where: query,
        skip,
        take: limitNum,
        order: sortConfig,
      }),
      apiKeyRepository.count({ where: query }),
    ]);

    // Get user info for each API key
    const userRepository = AppDataSource.getRepository(User);
    const enrichedKeys = await Promise.all(
      apiKeys.map(async (key) => {
        const user = await userRepository.findOne({
          where: { id: key.userId } as any,
          select: ["id", "email", "firstName", "lastName"],
        });

        return {
          id: key.id,
          name: key.name,
          description: key.description,
          keyPrefix: key.keyPrefix,
          status: key.status,
          permissions: key.permissions,
          scopes: key.scopes,
          expiresAt: key.expiresAt,
          lastUsedAt: key.lastUsedAt,
          usageCount: key.usageCount,
          rateLimitPerHour: key.rateLimitPerHour,
          allowedIPs: key.allowedIPs,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt,
          user: user ? {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          } : null,
        };
      })
    );

    res.json({
      apiKeys: enrichedKeys,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get API key by ID
router.get("/:id", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    const query: any = { id };
    
    // For non-admin users, only show their own keys
    if (req.user!.role !== "admin") {
      query.userId = req.user!.id.toString();
    }
    
    const apiKey = await apiKeyRepository.findOne({ where: query });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    // Get user info
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: apiKey.userId } as any,
      select: ["id", "email", "firstName", "lastName"],
    });

    res.json({
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description,
      keyPrefix: apiKey.keyPrefix,
      status: apiKey.status,
      permissions: apiKey.permissions,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      rateLimitPerHour: apiKey.rateLimitPerHour,
      allowedIPs: apiKey.allowedIPs,
      metadata: apiKey.metadata,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      user: user ? {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      } : null,
    });
  } catch (error) {
    logger.error("Error fetching API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new API key
router.post("/", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      permissions = [],
      scopes = [],
      expiresInDays,
      rateLimitPerHour,
      allowedIPs = [],
      metadata = {},
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "API key name is required"
      });
    }

    const apiKeyRepository = AppDataSource.getRepository(ApiKey);

    // Generate API key
    const { key, hash, prefix } = ApiKey.generateApiKey();

    // Create expiration date
    let expiresAt: Date | undefined;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create API key entity
    const apiKey = apiKeyRepository.create({
      name,
      description,
      keyHash: hash,
      keyPrefix: prefix,
      userId: req.user!.id.toString(),
      status: ApiKeyStatus.ACTIVE,
      permissions,
      scopes,
      expiresAt,
      rateLimitPerHour,
      allowedIPs,
      metadata,
    });

    // Validate the entity
    const errors = await validate(apiKey);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const savedApiKey = await apiKeyRepository.save(apiKey);

    res.status(201).json({
      message: "API key created successfully",
      apiKey: {
        id: savedApiKey.id,
        name: savedApiKey.name,
        description: savedApiKey.description,
        key, // Only return the actual key on creation
        keyPrefix: savedApiKey.keyPrefix,
        status: savedApiKey.status,
        permissions: savedApiKey.permissions,
        scopes: savedApiKey.scopes,
        expiresAt: savedApiKey.expiresAt,
        rateLimitPerHour: savedApiKey.rateLimitPerHour,
        allowedIPs: savedApiKey.allowedIPs,
        metadata: savedApiKey.metadata,
        createdAt: savedApiKey.createdAt,
      },
      warning: "Store this API key securely. You won't be able to see it again.",
    });
  } catch (error) {
    logger.error("Error creating API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update API key
router.put("/:id", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      permissions,
      scopes,
      rateLimitPerHour,
      allowedIPs,
      metadata,
    } = req.body;

    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    const query: any = { id };
    
    // For non-admin users, only allow updating their own keys
    if (req.user!.role !== "admin") {
      query.userId = req.user!.id.toString();
    }
    
    const apiKey = await apiKeyRepository.findOne({ where: query });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    // Update fields
    if (name !== undefined) apiKey.name = name;
    if (description !== undefined) apiKey.description = description;
    if (permissions !== undefined) apiKey.permissions = permissions;
    if (scopes !== undefined) apiKey.scopes = scopes;
    if (rateLimitPerHour !== undefined) apiKey.rateLimitPerHour = rateLimitPerHour;
    if (allowedIPs !== undefined) apiKey.allowedIPs = allowedIPs;
    if (metadata !== undefined) apiKey.metadata = metadata;

    apiKey.updatedAt = new Date();

    // Validate the updated entity
    const errors = await validate(apiKey);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const updatedApiKey = await apiKeyRepository.save(apiKey);

    res.json({
      message: "API key updated successfully",
      apiKey: {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        description: updatedApiKey.description,
        keyPrefix: updatedApiKey.keyPrefix,
        status: updatedApiKey.status,
        permissions: updatedApiKey.permissions,
        scopes: updatedApiKey.scopes,
        expiresAt: updatedApiKey.expiresAt,
        lastUsedAt: updatedApiKey.lastUsedAt,
        usageCount: updatedApiKey.usageCount,
        rateLimitPerHour: updatedApiKey.rateLimitPerHour,
        allowedIPs: updatedApiKey.allowedIPs,
        metadata: updatedApiKey.metadata,
        updatedAt: updatedApiKey.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error updating API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update API key status
router.patch("/:id/status", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(ApiKeyStatus).includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        validStatuses: Object.values(ApiKeyStatus)
      });
    }

    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    const query: any = { id };
    
    // For non-admin users, only allow updating their own keys
    if (req.user!.role !== "admin") {
      query.userId = req.user!.id.toString();
    }
    
    const apiKey = await apiKeyRepository.findOne({ where: query });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    apiKey.status = status;
    apiKey.updatedAt = new Date();

    await apiKeyRepository.save(apiKey);

    res.json({
      message: `API key ${status.toLowerCase()} successfully`,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        status: apiKey.status,
        updatedAt: apiKey.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error updating API key status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete API key
router.delete("/:id", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    const query: any = { id };
    
    // For non-admin users, only allow deleting their own keys
    if (req.user!.role !== "admin") {
      query.userId = req.user!.id.toString();
    }
    
    const apiKey = await apiKeyRepository.findOne({ where: query });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    await apiKeyRepository.remove(apiKey);

    res.json({
      message: "API key deleted successfully",
      deletedApiKey: {
        id: apiKey.id,
        name: apiKey.name,
      },
    });
  } catch (error) {
    logger.error("Error deleting API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get API key usage statistics
router.get("/:id/usage", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    const query: any = { id };
    
    // For non-admin users, only show their own keys
    if (req.user!.role !== "admin") {
      query.userId = req.user!.id.toString();
    }
    
    const apiKey = await apiKeyRepository.findOne({ where: query });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    // Calculate usage statistics
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - apiKey.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const averageUsagePerDay = daysSinceCreation > 0 ? apiKey.usageCount / daysSinceCreation : 0;
    
    const daysSinceLastUsed = apiKey.lastUsedAt 
      ? Math.floor((now.getTime() - apiKey.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      usage: {
        totalRequests: apiKey.usageCount,
        lastUsedAt: apiKey.lastUsedAt,
        daysSinceLastUsed,
        averageUsagePerDay: Math.round(averageUsagePerDay * 100) / 100,
        isActive: apiKey.isValid(),
        rateLimitPerHour: apiKey.rateLimitPerHour,
        expiresAt: apiKey.expiresAt,
        daysUntilExpiration: apiKey.expiresAt 
          ? Math.floor((apiKey.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
      keyInfo: {
        id: apiKey.id,
        name: apiKey.name,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    logger.error("Error fetching API key usage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Regenerate API key
router.post("/:id/regenerate", authenticate, authorize([Permission.ADMIN_API_KEYS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    
    const query: any = { id };
    
    // For non-admin users, only allow regenerating their own keys
    if (req.user!.role !== "admin") {
      query.userId = req.user!.id.toString();
    }
    
    const apiKey = await apiKeyRepository.findOne({ where: query });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    // Generate new API key
    const { key, hash, prefix } = ApiKey.generateApiKey();

    // Update the API key
    apiKey.keyHash = hash;
    apiKey.keyPrefix = prefix;
    apiKey.updatedAt = new Date();
    apiKey.usageCount = 0; // Reset usage count
    apiKey.lastUsedAt = undefined; // Reset last used

    await apiKeyRepository.save(apiKey);

    res.json({
      message: "API key regenerated successfully",
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key, // Only return the actual key on regeneration
        keyPrefix: apiKey.keyPrefix,
        status: apiKey.status,
        updatedAt: apiKey.updatedAt,
      },
      warning: "Store this new API key securely. The old key is now invalid.",
    });
  } catch (error) {
    logger.error("Error regenerating API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
