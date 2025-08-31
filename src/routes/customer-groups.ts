import { Router, Request, Response } from "express";
import { Like } from "typeorm";
import { AppDataSource } from "../data-source";
import { CustomerGroup } from "../entities/CustomerGroup";
import { validate } from "class-validator";
import logger from "../utils/logger";

const router = Router();

// Get all customer groups with basic pagination and search
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search, isActive } = req.query;

    const customerGroupRepository = AppDataSource.getRepository(CustomerGroup);

    const where: any = {};
    if (typeof search === "string" && search.length > 0) {
      where.name = Like(`%${search}%`);
    }
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [customerGroups, total] = await customerGroupRepository.findAndCount({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { createdAt: "DESC" },
    });

    res.json({
      customerGroups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching customer groups:", error);
    res.status(500).json({ error: "Failed to fetch customer groups" });
  }
});

// Get single customer group by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerGroupRepository = AppDataSource.getRepository(CustomerGroup);

    const group = await customerGroupRepository.findOne({ where: { id } });

    if (!group) {
      return res.status(404).json({ error: "Customer group not found" });
    }

    res.json(group);
  } catch (error) {
    logger.error("Error fetching customer group:", error);
    res.status(500).json({ error: "Failed to fetch customer group" });
  }
});

// Create customer group
router.post("/", async (req: Request, res: Response) => {
  try {
    const customerGroupRepository = AppDataSource.getRepository(CustomerGroup);
    const group = customerGroupRepository.create(req.body);

    const errors = await validate(group);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const saved = await customerGroupRepository.save(group);
    res.status(201).json(saved);
  } catch (error) {
    logger.error("Error creating customer group:", error);
    res.status(500).json({ error: "Failed to create customer group" });
  }
});

// Update customer group
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerGroupRepository = AppDataSource.getRepository(CustomerGroup);

    const group = await customerGroupRepository.findOne({ where: { id } });
    if (!group) {
      return res.status(404).json({ error: "Customer group not found" });
    }

    Object.assign(group, req.body);

    const errors = await validate(group);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updated = await customerGroupRepository.save(group);
    res.json(updated);
  } catch (error) {
    logger.error("Error updating customer group:", error);
    res.status(500).json({ error: "Failed to update customer group" });
  }
});

// Delete customer group
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerGroupRepository = AppDataSource.getRepository(CustomerGroup);

    const result = await customerGroupRepository.delete(id);
    if (result.affected === 0) {
      return res.status(404).json({ error: "Customer group not found" });
    }

    res.json({ message: "Customer group deleted" });
  } catch (error) {
    logger.error("Error deleting customer group:", error);
    res.status(500).json({ error: "Failed to delete customer group" });
  }
});

export default router;
