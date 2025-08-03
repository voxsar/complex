import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { FulfillmentCenter } from "../entities/FulfillmentCenter";
import { validate } from "class-validator";

const router = Router();

// Get all fulfillment centers
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      country,
      state,
      canShip,
      canReceive,
      sortBy = "priority",
      sortOrder = "desc",
    } = req.query;

    const fulfillmentCenterRepository = AppDataSource.getRepository(FulfillmentCenter);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (country) {
      query.country = country;
    }
    
    if (state) {
      query.state = state;
    }
    
    if (canShip !== undefined) {
      query.canShip = canShip === "true";
    }
    
    if (canReceive !== undefined) {
      query.canReceive = canReceive === "true";
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [centers, total] = await Promise.all([
      fulfillmentCenterRepository.find({
        where: query,
        skip,
        take: limitNum,
        order: sortConfig,
      }),
      fulfillmentCenterRepository.count({ where: query }),
    ]);

    res.json({
      centers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching fulfillment centers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get fulfillment center by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fulfillmentCenterRepository = AppDataSource.getRepository(FulfillmentCenter);
    
    const center = await fulfillmentCenterRepository.findOne({
      where: { id },
    });

    if (!center) {
      return res.status(404).json({ error: "Fulfillment center not found" });
    }

    res.json(center);
  } catch (error) {
    console.error("Error fetching fulfillment center:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new fulfillment center
router.post("/", async (req: Request, res: Response) => {
  try {
    const fulfillmentCenterRepository = AppDataSource.getRepository(FulfillmentCenter);
    
    const center = fulfillmentCenterRepository.create(req.body);
    
    // Validate the entity
    const errors = await validate(center);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const savedCenter = await fulfillmentCenterRepository.save(center);
    res.status(201).json(savedCenter);
  } catch (error) {
    console.error("Error creating fulfillment center:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update fulfillment center
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fulfillmentCenterRepository = AppDataSource.getRepository(FulfillmentCenter);
    
    const existingCenter = await fulfillmentCenterRepository.findOne({
      where: { id },
    });

    if (!existingCenter) {
      return res.status(404).json({ error: "Fulfillment center not found" });
    }

    // Update the center
    Object.assign(existingCenter, req.body);
    existingCenter.updatedAt = new Date();

    // Validate the updated entity
    const errors = await validate(existingCenter);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const updatedCenter = await fulfillmentCenterRepository.save(existingCenter);
    res.json(updatedCenter);
  } catch (error) {
    console.error("Error updating fulfillment center:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete fulfillment center
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fulfillmentCenterRepository = AppDataSource.getRepository(FulfillmentCenter);
    
    const center = await fulfillmentCenterRepository.findOne({
      where: { id },
    });

    if (!center) {
      return res.status(404).json({ error: "Fulfillment center not found" });
    }

    await fulfillmentCenterRepository.remove(center);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting fulfillment center:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Find optimal fulfillment center for an order
router.post("/find-optimal", async (req: Request, res: Response) => {
  try {
    const {
      shippingAddress,
      items,
      requiresShipping = true,
    } = req.body;

    if (!shippingAddress || !items) {
      return res.status(400).json({
        error: "Missing required fields: shippingAddress, items"
      });
    }

    const fulfillmentCenterRepository = AppDataSource.getRepository(FulfillmentCenter);

    // Build query for eligible centers
    const query: any = {
      status: "ACTIVE",
    };

    if (requiresShipping) {
      query.canShip = true;
    }

    const centers = await fulfillmentCenterRepository.find({
      where: query,
      order: { priority: "DESC" },
    });

    if (centers.length === 0) {
      return res.json({
        center: null,
        message: "No eligible fulfillment centers found"
      });
    }

    // Simple logic: prefer default center, then by priority
    let optimalCenter = centers.find(center => center.isDefault);
    
    if (!optimalCenter) {
      optimalCenter = centers[0]; // Highest priority
    }

    // In a real implementation, you would also consider:
    // - Inventory availability at each center
    // - Distance to shipping address
    // - Shipping costs from each center
    // - Center capacity and operating hours

    res.json({
      center: optimalCenter,
      alternatives: centers.filter(c => c.id !== optimalCenter.id).slice(0, 3),
      recommendationReason: optimalCenter.isDefault ? "Default center" : "Highest priority center",
    });
  } catch (error) {
    console.error("Error finding optimal fulfillment center:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get inventory levels for a fulfillment center
router.get("/:id/inventory", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, productId, lowStock } = req.query;

    const fulfillmentCenterRepository = AppDataSource.getRepository(FulfillmentCenter);
    
    const center = await fulfillmentCenterRepository.findOne({
      where: { id },
    });

    if (!center) {
      return res.status(404).json({ error: "Fulfillment center not found" });
    }

    // This would typically query a separate inventory table
    // For now, we'll return a placeholder response
    res.json({
      center: {
        id: center.id,
        name: center.name,
        code: center.code,
      },
      inventory: [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        pages: 0,
      },
      message: "Inventory tracking not yet implemented"
    });
  } catch (error) {
    console.error("Error fetching fulfillment center inventory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
