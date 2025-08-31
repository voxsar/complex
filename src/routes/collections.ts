import { Router, Request, Response } from "express";
import { validate } from "class-validator";
import { AppDataSource } from "../data-source";
import { Collection } from "../entities/Collection";
import logger from "../utils/logger";

const router = Router();

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
