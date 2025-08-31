import { Router, Request, Response } from "express";
import { validate } from "class-validator";
import { AppDataSource } from "../data-source";
import { Collection } from "../entities/Collection";
import logger from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

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
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();
  res.setHeader("X-Request-Id", requestId);
  logger.info({ requestId }, "Create collection request started");

  try {
    const { title, slug } = req.body;
    if (!title) {
      logger.debug({ requestId }, "Validation failed: title is required");
      return res.status(400).json({ error: "Title is required" });
    }
    if (!slug) {
      logger.debug({ requestId }, "Validation failed: slug is required");
      return res.status(400).json({ error: "Slug is required" });
    }

    const collectionRepository = AppDataSource.getRepository(Collection);
    const collection = collectionRepository.create(req.body);

    const errors = await validate(collection);
    if (errors.length > 0) {
      logger.debug({ requestId, errors }, "Validation failed for collection");
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const saved = await collectionRepository.save(collection);
    logger.info({ requestId, id: saved.id }, "Collection saved successfully");
    res.status(201).json(saved);
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      logger.debug({ requestId, error }, "Slug must be unique");
      return res.status(409).json({ error: "Collection slug must be unique" });
    }
    logger.error({ requestId, error }, "Error creating collection");
    res.status(500).json({ error: "Failed to create collection" });
  }
});

export default router;
