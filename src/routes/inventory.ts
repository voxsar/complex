import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Inventory } from "../entities/Inventory";
import { validate } from "class-validator";

const router = Router();

// Get all inventory items
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      productId,
      variantId,
      lowStock,
      outOfStock,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const inventoryRepository = AppDataSource.getRepository(Inventory);
    
    // Build MongoDB query
    const query: any = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    if (variantId) {
      query.variantId = variantId;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get inventory items
    let [inventory, total] = await Promise.all([
      inventoryRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      inventoryRepository.count({ where: query })
    ]);

    // Apply filters that need computation
    if (lowStock === "true") {
      inventory = inventory.filter(item => item.isLowStock);
    }
    
    if (outOfStock === "true") {
      inventory = inventory.filter(item => item.isOutOfStock);
    }

    // Add computed properties to each inventory item
    const inventoryWithComputedProps = inventory.map(item => ({
      ...item,
      availableQuantity: item.availableQuantity,
      isLowStock: item.isLowStock,
      isOutOfStock: item.isOutOfStock
    }));

    res.json({
      inventory: inventoryWithComputedProps,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Get inventory by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inventoryRepository = AppDataSource.getRepository(Inventory);

    const inventory = await inventoryRepository.findOne({
      where: { id }
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Add computed properties
    const inventoryWithComputedProps = {
      ...inventory,
      availableQuantity: inventory.availableQuantity,
      isLowStock: inventory.isLowStock,
      isOutOfStock: inventory.isOutOfStock
    };

    res.json(inventoryWithComputedProps);
  } catch (error) {
    logger.error("Error fetching inventory item:", error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
});

// Create inventory item
router.post("/", async (req: Request, res: Response) => {
  try {
    const inventoryRepository = AppDataSource.getRepository(Inventory);
    
    const inventory = inventoryRepository.create(req.body);
    
    // Validate
    const errors = await validate(inventory);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedInventory = await inventoryRepository.save(inventory);
    res.status(201).json(savedInventory);
  } catch (error) {
    logger.error("Error creating inventory item:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// Update inventory item
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inventoryRepository = AppDataSource.getRepository(Inventory);

    const inventory = await inventoryRepository.findOne({
      where: { id }
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Update fields
    Object.assign(inventory, req.body);
    
    // Validate
    const errors = await validate(inventory);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedInventory = await inventoryRepository.save(inventory);
    res.json(updatedInventory);
  } catch (error) {
    logger.error("Error updating inventory item:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// Adjust inventory quantity
router.post("/:id/adjust", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    const inventoryRepository = AppDataSource.getRepository(Inventory);

    const inventory = await inventoryRepository.findOne({
      where: { id }
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    inventory.quantity = Math.max(0, inventory.quantity + quantity);

    const updatedInventory = await inventoryRepository.save(inventory);
    res.json(updatedInventory);
  } catch (error) {
    logger.error("Error adjusting inventory:", error);
    res.status(500).json({ error: "Failed to adjust inventory" });
  }
});

// Reserve inventory
router.post("/:id/reserve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const inventoryRepository = AppDataSource.getRepository(Inventory);

    const inventory = await inventoryRepository.findOne({
      where: { id }
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    if (inventory.availableQuantity < quantity) {
      return res.status(400).json({ error: "Insufficient inventory" });
    }

    inventory.reservedQuantity += quantity;

    const updatedInventory = await inventoryRepository.save(inventory);
    res.json(updatedInventory);
  } catch (error) {
    logger.error("Error reserving inventory:", error);
    res.status(500).json({ error: "Failed to reserve inventory" });
  }
});

// Release reserved inventory
router.post("/:id/release", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const inventoryRepository = AppDataSource.getRepository(Inventory);

    const inventory = await inventoryRepository.findOne({
      where: { id }
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - quantity);

    const updatedInventory = await inventoryRepository.save(inventory);
    res.json(updatedInventory);
  } catch (error) {
    logger.error("Error releasing inventory:", error);
    res.status(500).json({ error: "Failed to release inventory" });
  }
});

export default router;
