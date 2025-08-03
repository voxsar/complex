import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ShippingProvider } from "../entities/ShippingProvider";
import { validate } from "class-validator";

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
    console.error("Error fetching shipping providers:", error);
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
    console.error("Error fetching shipping provider:", error);
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

    const savedProvider = await shippingProviderRepository.save(provider);
    
    // Remove sensitive information from response
    const sanitizedProvider = {
      ...savedProvider,
      apiKey: savedProvider.apiKey ? "*".repeat(8) : undefined,
      apiSecret: savedProvider.apiSecret ? "*".repeat(8) : undefined,
      password: savedProvider.password ? "*".repeat(8) : undefined,
    };

    res.status(201).json(sanitizedProvider);
  } catch (error) {
    console.error("Error creating shipping provider:", error);
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

    const updatedProvider = await shippingProviderRepository.save(existingProvider);
    
    // Remove sensitive information from response
    const sanitizedProvider = {
      ...updatedProvider,
      apiKey: updatedProvider.apiKey ? "*".repeat(8) : undefined,
      apiSecret: updatedProvider.apiSecret ? "*".repeat(8) : undefined,
      password: updatedProvider.password ? "*".repeat(8) : undefined,
    };

    res.json(sanitizedProvider);
  } catch (error) {
    console.error("Error updating shipping provider:", error);
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
    console.error("Error deleting shipping provider:", error);
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

    // Simulate API connection test
    // In a real implementation, this would make actual API calls to test connectivity
    const testResult = {
      success: true,
      message: "Connection test successful",
      provider: provider.name,
      type: provider.type,
      timestamp: new Date(),
    };

    // For demonstration, randomly fail some tests
    if (Math.random() < 0.1) { // 10% chance of failure
      testResult.success = false;
      testResult.message = "Connection test failed: Authentication error";
    }

    res.json(testResult);
  } catch (error) {
    console.error("Error testing shipping provider connection:", error);
    res.status(500).json({ error: "Internal server error" });
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

    // Simulate real-time rate calculation
    // In a real implementation, this would integrate with actual shipping APIs
    const mockRates = [
      {
        serviceCode: "GROUND",
        serviceName: "Ground",
        cost: 12.50,
        estimatedDays: { min: 3, max: 5 },
        deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
      {
        serviceCode: "EXPRESS",
        serviceName: "Express",
        cost: 25.00,
        estimatedDays: { min: 1, max: 2 },
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    ];

    res.json({
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
      },
      rates: mockRates,
      fromAddress,
      toAddress,
      packages,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error getting real-time shipping rates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
