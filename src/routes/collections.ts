import { Router, Request, Response } from "express";
import { validate } from "class-validator";
import { AppDataSource } from "../data-source";
import { Collection } from "../entities/Collection";
import logger from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

const router = Router();

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
