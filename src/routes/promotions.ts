import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Promotion } from "../entities/Promotion";
import { PromotionStatus } from "../enums/promotion_status";
import { validate } from "class-validator";

const router = Router();

// Get all promotions
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      active,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const promotionRepository = AppDataSource.getRepository(Promotion);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get promotions
    let [promotions, total] = await Promise.all([
      promotionRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      promotionRepository.count({ where: query })
    ]);

    // Filter by active status if requested
    if (active === "true") {
      promotions = promotions.filter(promo => promo.isActive);
    }

    res.json({
      promotions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

// Get promotion by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promotionRepository = AppDataSource.getRepository(Promotion);

    const promotion = await promotionRepository.findOne({
      where: { id }
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    res.json(promotion);
  } catch (error) {
    console.error("Error fetching promotion:", error);
    res.status(500).json({ error: "Failed to fetch promotion" });
  }
});

// Create promotion
router.post("/", async (req: Request, res: Response) => {
  try {
    const promotionRepository = AppDataSource.getRepository(Promotion);
    
    const promotion = promotionRepository.create(req.body);
    
    // Validate
    const errors = await validate(promotion);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedPromotion = await promotionRepository.save(promotion);
    res.status(201).json(savedPromotion);
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({ error: "Failed to create promotion" });
  }
});

// Update promotion
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promotionRepository = AppDataSource.getRepository(Promotion);

    const promotion = await promotionRepository.findOne({
      where: { id }
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    // Update fields
    Object.assign(promotion, req.body);
    
    // Validate
    const errors = await validate(promotion);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedPromotion = await promotionRepository.save(promotion);
    res.json(updatedPromotion);
  } catch (error) {
    console.error("Error updating promotion:", error);
    res.status(500).json({ error: "Failed to update promotion" });
  }
});

// Activate promotion
router.post("/:id/activate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promotionRepository = AppDataSource.getRepository(Promotion);

    const promotion = await promotionRepository.findOne({
      where: { id }
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    promotion.status = PromotionStatus.ACTIVE;

    const updatedPromotion = await promotionRepository.save(promotion);
    res.json(updatedPromotion);
  } catch (error) {
    console.error("Error activating promotion:", error);
    res.status(500).json({ error: "Failed to activate promotion" });
  }
});

// Deactivate promotion
router.post("/:id/deactivate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promotionRepository = AppDataSource.getRepository(Promotion);

    const promotion = await promotionRepository.findOne({
      where: { id }
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    promotion.status = PromotionStatus.INACTIVE;

    const updatedPromotion = await promotionRepository.save(promotion);
    res.json(updatedPromotion);
  } catch (error) {
    console.error("Error deactivating promotion:", error);
    res.status(500).json({ error: "Failed to deactivate promotion" });
  }
});

export default router;
