import { Router, Request, Response } from "express";
import { validate } from "class-validator";
import { AppDataSource } from "../data-source";
import { Collection } from "../entities/Collection";
import logger from "../utils/logger";

const router = Router();

// Get all collections with pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const collectionRepository = AppDataSource.getRepository(Collection);
    const [collections, total] = await collectionRepository.findAndCount({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { createdAt: "DESC" },
    });

    res.json({
      collections,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// Get a single collection by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collectionRepository = AppDataSource.getRepository(Collection);

    const collection = await collectionRepository.findOne({ where: { id } });

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    res.json({ collection });
  } catch (error) {
    logger.error("Error fetching collection:", error);
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

// Create collection
router.post("/", async (req: Request, res: Response) => {
  try {
    const collectionRepository = AppDataSource.getRepository(Collection);
    const collection = collectionRepository.create(req.body);

    const errors = await validate(collection);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const saved = await collectionRepository.save(collection);
    res.status(201).json(saved);
  } catch (error) {
    logger.error("Error creating collection:", error);
    res.status(500).json({ error: "Failed to create collection" });
  }
});

export default router;
