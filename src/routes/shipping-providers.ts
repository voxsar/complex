import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ShippingProvider } from "../entities/ShippingProvider";
import { validate } from "class-validator";
import { getShippingAdapter, ProviderError } from "../services/shipping";

const router = Router();

// Get all shipping providers
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      isActive,
      isTestMode,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const shippingProviderRepository = AppDataSource.getRepository(ShippingProvider);
    
    // Build MongoDB query
    const query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    if (isTestMode !== undefined) {
      query.isTestMode = isTestMode === "true";
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [providers, total] = await Promise.all([
      shippingProviderRepository.find({
        where: query,
        skip,
        take: limitNum,
        order: sortConfig,
      }),
      shippingProviderRepository.count({ where: query }),
    ]);

    // Remove sensitive information from response
    const sanitizedProviders = providers.map(provider => ({
      ...provider,
      apiKey: provider.apiKey ? "*".repeat(8) : undefined,
      apiSecret: provider.apiSecret ? "*".repeat(8) : undefined,
      password: provider.password ? "*".repeat(8) : undefined,
    }));

    res.json({
      providers: sanitizedProviders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error("Error fetching shipping providers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get shipping provider by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingProviderRepository = AppDataSource.getRepository(ShippingProvider);
    
    const provider = await shippingProviderRepository.findOne({
      where: { id },
    });

    if (!provider) {
      return res.status(404).json({ error: "Shipping provider not found" });
    }

    // Remove sensitive information from response
    const sanitizedProvider = {
      ...provider,
      apiKey: provider.apiKey ? "*".repeat(8) : undefined,
      apiSecret: provider.apiSecret ? "*".repeat(8) : undefined,
      password: provider.password ? "*".repeat(8) : undefined,
    };

    res.json(sanitizedProvider);
  } catch (error) {
    logger.error("Error fetching shipping provider:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new shipping provider
router.post("/", async (req: Request, res: Response) => {
  try {
    const shippingProviderRepository = AppDataSource.getRepository(ShippingProvider);
    
    const provider = shippingProviderRepository.create(req.body);
    
    // Validate the entity
    const errors = await validate(provider);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const savedProvider = await shippingProviderRepository.save(provider) as unknown as ShippingProvider;
    
    // Remove sensitive information from response
    const sanitizedProvider = {
      ...savedProvider,
      apiKey: savedProvider.apiKey ? "*".repeat(8) : undefined,
      apiSecret: savedProvider.apiSecret ? "*".repeat(8) : undefined,
      password: savedProvider.password ? "*".repeat(8) : undefined,
    };

    res.status(201).json(sanitizedProvider);
  } catch (error) {
    logger.error("Error creating shipping provider:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update shipping provider
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingProviderRepository = AppDataSource.getRepository(ShippingProvider);
    
    const existingProvider = await shippingProviderRepository.findOne({
      where: { id },
    });

    if (!existingProvider) {
      return res.status(404).json({ error: "Shipping provider not found" });
    }

    // Update the provider
    Object.assign(existingProvider, req.body);
    existingProvider.updatedAt = new Date();

    // Validate the updated entity
    const errors = await validate(existingProvider);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const updatedProvider = await shippingProviderRepository.save(existingProvider) as unknown as ShippingProvider;
    
    // Remove sensitive information from response
    const sanitizedProvider = {
      ...updatedProvider,
      apiKey: updatedProvider.apiKey ? "*".repeat(8) : undefined,
      apiSecret: updatedProvider.apiSecret ? "*".repeat(8) : undefined,
      password: updatedProvider.password ? "*".repeat(8) : undefined,
    };

    res.json(sanitizedProvider);
  } catch (error) {
    logger.error("Error updating shipping provider:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete shipping provider
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingProviderRepository = AppDataSource.getRepository(ShippingProvider);
    
    const provider = await shippingProviderRepository.findOne({
      where: { id },
    });

    if (!provider) {
      return res.status(404).json({ error: "Shipping provider not found" });
    }

    await shippingProviderRepository.remove(provider);
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting shipping provider:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test shipping provider connection
router.post("/:id/test-connection", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingProviderRepository = AppDataSource.getRepository(ShippingProvider);

    const provider = await shippingProviderRepository.findOne({
      where: { id },
    });

    if (!provider) {
      return res.status(404).json({ error: "Shipping provider not found" });
    }

    if (!provider.isActive) {
      return res.status(400).json({ error: "Shipping provider is not active" });
    }

    const adapter = getShippingAdapter(provider.type);
    if (!adapter) {
      return res.status(400).json({ error: "Unsupported shipping provider" });
    }

    const credentials = {
      apiKey: provider.apiKey,
      apiSecret: provider.apiSecret,
      accountNumber: provider.accountNumber,
      meterNumber: provider.meterNumber,
      userId: provider.userId,
      password: provider.password,
      apiEndpoint: provider.apiEndpoint,
      isTestMode: provider.isTestMode,
    };

    const result = await adapter.testConnection(credentials);
    res.json(result);
  } catch (error) {
    logger.error("Error testing shipping provider connection:", error);
    if (error instanceof ProviderError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Get real-time shipping rates from provider
router.post("/:id/get-rates", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fromAddress,
      toAddress,
      packages,
      services,
    } = req.body;

    if (!fromAddress || !toAddress || !packages) {
      return res.status(400).json({
        error: "Missing required fields: fromAddress, toAddress, packages"
      });
    }

    const shippingProviderRepository = AppDataSource.getRepository(ShippingProvider);

    const provider = await shippingProviderRepository.findOne({
      where: { id },
    });

    if (!provider) {
      return res.status(404).json({ error: "Shipping provider not found" });
    }

    if (!provider.isActive) {
      return res.status(400).json({ error: "Shipping provider is not active" });
    }

    const adapter = getShippingAdapter(provider.type);
    if (!adapter) {
      return res.status(400).json({ error: "Unsupported shipping provider" });
    }

    const credentials = {
      apiKey: provider.apiKey,
      apiSecret: provider.apiSecret,
      accountNumber: provider.accountNumber,
      meterNumber: provider.meterNumber,
      userId: provider.userId,
      password: provider.password,
      apiEndpoint: provider.apiEndpoint,
      isTestMode: provider.isTestMode,
    };

    const rates = await adapter.getRates(credentials, {
      fromAddress,
      toAddress,
      packages,
      services,
    });

    res.json({
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
      },
      rates,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Error getting real-time shipping rates:", error);
    if (error instanceof ProviderError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
