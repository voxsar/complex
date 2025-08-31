import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PaymentProvider } from "../entities/PaymentProvider";
import { validate } from "class-validator";

const router = Router();

// Get all payment providers
router.get("/", async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(PaymentProvider);
    const providers = await repo.find();
    res.json({ providers });
  } catch (err) {
    logger.error("Error fetching payment providers:", err);
    res.status(500).json({ error: "Failed to fetch payment providers" });
  }
});

// Create payment provider
router.post("/", async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(PaymentProvider);
    const provider = repo.create(req.body);
    const errors = await validate(provider);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const saved = await repo.save(provider);
    res.status(201).json(saved);
  } catch (err) {
    logger.error("Error creating payment provider:", err);
    res.status(500).json({ error: "Failed to create payment provider" });
  }
});

// Update payment provider (enable/disable or other fields)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(PaymentProvider);
    const provider = await repo.findOne({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ error: "Payment provider not found" });
    }
    Object.assign(provider, req.body);
    const errors = await validate(provider);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const saved = await repo.save(provider);
    res.json(saved);
  } catch (err) {
    logger.error("Error updating payment provider:", err);
    res.status(500).json({ error: "Failed to update payment provider" });
  }
});

// Delete payment provider
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(PaymentProvider);
    const provider = await repo.findOne({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ error: "Payment provider not found" });
    }
    await repo.remove(provider);
    res.status(204).send();
  } catch (err) {
    logger.error("Error deleting payment provider:", err);
    res.status(500).json({ error: "Failed to delete payment provider" });
  }
});

export default router;
