import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ProductOption } from "../entities/ProductOption";
import { validate } from "class-validator";

const router = Router();

async function validateOptionPayload(
  data: Partial<ProductOption>,
  repository = AppDataSource.getRepository(ProductOption),
  ignoreId?: string
) {
  const errors: Record<string, string> = {};

  // Run class-validator checks
  const entity = repository.create(data);
  const validationErrors = await validate(entity);
  for (const err of validationErrors) {
    if (err.constraints && !errors[err.property]) {
      errors[err.property] = Object.values(err.constraints).join(", ");
    }
  }

  // Name must be unique
  if (data.name) {
    const existing = await repository.findOne({ where: { name: data.name } });
    if (existing && existing.id !== ignoreId) {
      errors.name = "Name must be unique";
    }
  }

  // Values array must not be empty for non-text input types
  if (data.inputType && data.inputType !== "text") {
    if (!Array.isArray((data as any).values) || (data as any).values.length === 0) {
      errors.values = "Values array must contain at least one value";
    }
  }

  return errors;
}

// Get all product options
router.get("/", async (req: Request, res: Response) => {
  logger.debug("List product options", { query: req.query });
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
  logger.debug("Get product option", { params: req.params });
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
  logger.debug("Create product option", { body: req.body });
  try {
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const errors = await validateOptionPayload(req.body, optionRepository);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const option = optionRepository.create(req.body);
    const savedOption = await optionRepository.save(option);
    logger.info("Product option created", { id: savedOption.id });
    res.status(201).json(savedOption);
  } catch (error) {
    logger.error("Error creating product option:", error);
    res.status(500).json({ error: "Failed to create product option" });
  }
});

// Update product option
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.debug("Update product option", { id, body: req.body });
  try {
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    // Update fields
    Object.assign(option, req.body);

    const errors = await validateOptionPayload(option, optionRepository, id);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedOption = await optionRepository.save(option);
    logger.info("Product option updated", { id: updatedOption.id });
    res.json(updatedOption);
  } catch (error) {
    logger.error("Error updating product option:", error);
    res.status(500).json({ error: "Failed to update product option" });
  }
});

// Delete product option
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.debug("Delete product option", { params: req.params });
  try {
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const result = await optionRepository.delete({ id });

    if (result.affected === 0) {
      return res.status(404).json({ error: "Product option not found" });
    }

    logger.info("Product option deleted", { id });
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting product option:", error);
    res.status(500).json({ error: "Failed to delete product option" });
  }
});

// Add value to option
router.post("/:id/values", async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.debug("Add option value", { id, body: req.body });
  try {
    const { value, displayValue, ...metadata } = req.body;
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    const optionValue = option.addValue(value, displayValue, metadata);

    await optionRepository.save(option);
    logger.info("Option value added", { optionId: id, valueId: optionValue.id });
    res.status(201).json(optionValue);
  } catch (error) {
    logger.error("Error adding option value:", error);
    res.status(500).json({ error: "Failed to add option value" });
  }
});

// Update option value
router.put("/:id/values/:valueId", async (req: Request, res: Response) => {
  const { id, valueId } = req.params;
  logger.debug("Update option value", { id, valueId, body: req.body });
  try {
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
    logger.info("Option value updated", { optionId: id, valueId });
    res.json(option.values[valueIndex]);
  } catch (error) {
    logger.error("Error updating option value:", error);
    res.status(500).json({ error: "Failed to update option value" });
  }
});

// Delete option value
router.delete("/:id/values/:valueId", async (req: Request, res: Response) => {
  const { id, valueId } = req.params;
  logger.debug("Delete option value", { id, valueId });
  try {
    const optionRepository = AppDataSource.getRepository(ProductOption);

    const option = await optionRepository.findOne({
      where: { id }
    });

    if (!option) {
      return res.status(404).json({ error: "Product option not found" });
    }

    option.removeValue(valueId);

    await optionRepository.save(option);
    logger.info("Option value deleted", { optionId: id, valueId });
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting option value:", error);
    res.status(500).json({ error: "Failed to delete option value" });
  }
});

export default router;
