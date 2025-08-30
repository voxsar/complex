import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ProductOption } from "../entities/ProductOption";
import { validate } from "class-validator";

const router = Router();

// Get all product options
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      productId,
      search,
      sortBy = "position",
      sortOrder = "asc",
    } = req.query;

    const optionRepository = AppDataSource.getRepository(ProductOption);
    
    // Build MongoDB query
    const query: any = {};
    
    if (productId) {
      query.productIds = { $in: [productId] };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get options
    const [options, total] = await Promise.all([
      optionRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      optionRepository.count({ where: query })
    ]);

    res.json({
      options,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching product options:", error);
    res.status(500).json({ error: "Failed to fetch product options" });
  }
});

// Get option by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    res.json(option);
  } catch (error) {
    logger.error("Error fetching product option:", error);
    res.status(500).json({ error: "Failed to fetch product option" });
  }
});

// Create product option
router.post("/", async (req: Request, res: Response) => {
  try {
    const optionRepository = AppDataSource.getRepository(ProductOption);
    
    const option = optionRepository.create(req.body);
    
    // Validate
    const errors = await validate(option);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedOption = await optionRepository.save(option);
    res.status(201).json(savedOption);
  } catch (error) {
    logger.error("Error creating product option:", error);
    res.status(500).json({ error: "Failed to create product option" });
  }
});

// Update product option
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    // Update fields
    Object.assign(option, req.body);
    
    // Validate
    const errors = await validate(option);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedOption = await optionRepository.save(option);
    res.json(updatedOption);
  } catch (error) {
    logger.error("Error updating product option:", error);
    res.status(500).json({ error: "Failed to update product option" });
  }
});

// Delete product option
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const result = await optionRepository.delete({ id });

    if (result.affected === 0) {
      return res.status(404).json({ error: "Product option not found" });
    }

    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting product option:", error);
    res.status(500).json({ error: "Failed to delete product option" });
  }
});

// Add value to option
router.post("/:id/values", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { value, displayValue, ...metadata } = req.body;
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    const optionValue = option.addValue(value, displayValue, metadata);
    
    const updatedOption = await optionRepository.save(option);
    res.status(201).json(optionValue);
  } catch (error) {
    logger.error("Error adding option value:", error);
    res.status(500).json({ error: "Failed to add option value" });
  }
});

// Update option value
router.put("/:id/values/:valueId", async (req: Request, res: Response) => {
  try {
    const { id, valueId } = req.params;
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    const valueIndex = option.values.findIndex(v => v.id === valueId);
    
    if (valueIndex === -1) {
      return res.status(404).json({ error: "Option value not found" });
    }

    // Update value
    option.values[valueIndex] = {
      ...option.values[valueIndex],
      ...req.body,
    };

    await optionRepository.save(option);
    res.json(option.values[valueIndex]);
  } catch (error) {
    logger.error("Error updating option value:", error);
    res.status(500).json({ error: "Failed to update option value" });
  }
});

// Delete option value
router.delete("/:id/values/:valueId", async (req: Request, res: Response) => {
  try {
    const { id, valueId } = req.params;
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    option.removeValue(valueId);
    
    await optionRepository.save(option);
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting option value:", error);
    res.status(500).json({ error: "Failed to delete option value" });
  }
});

export default router;
