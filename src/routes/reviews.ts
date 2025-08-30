import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Review } from "../entities/Review";
import { Product } from "../entities/Product";
import { ReviewStatus } from "../enums/review_status";
import { validate } from "class-validator";

const router = Router();

async function updateProductRating(productId: string) {
  const reviewRepository = AppDataSource.getRepository(Review);
  const productRepository = AppDataSource.getRepository(Product);

  const reviews = await reviewRepository.find({
    where: { productId, status: ReviewStatus.APPROVED },
  });

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  await productRepository.update(
    { id: productId },
    { averageRating, reviewCount }
  );
}

// List reviews with pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      productId,
      customerId,
      status,
    } = req.query;

    const reviewRepository = AppDataSource.getRepository(Review);
    const query: any = {};

    if (productId) query.productId = productId;
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      reviewRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { createdAt: "DESC" },
      }),
      reviewRepository.count({ where: query }),
    ]);

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get single review
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviewRepository = AppDataSource.getRepository(Review);

    const review = await reviewRepository.findOne({ where: { id } });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Create review
router.post("/", async (req: Request, res: Response) => {
  try {
    const reviewRepository = AppDataSource.getRepository(Review);

    const review = reviewRepository.create(req.body as Partial<Review>);

    const errors = await validate(review);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedReview = await reviewRepository.save(review);
    await updateProductRating(savedReview.productId);

    res.status(201).json(savedReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update review
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviewRepository = AppDataSource.getRepository(Review);

    const review = await reviewRepository.findOne({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    Object.assign(review, req.body);
    const errors = await validate(review);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedReview = await reviewRepository.save(review);
    await updateProductRating(updatedReview.productId);

    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete review
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviewRepository = AppDataSource.getRepository(Review);

    const review = await reviewRepository.findOne({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    await reviewRepository.remove(review);
    await updateProductRating(review.productId);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
