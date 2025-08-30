import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Wishlist } from "../entities/Wishlist";
import { authenticateCustomer, CustomerAuthRequest } from "../middleware/customerAuth";

const router = Router();

// Get customer's wishlist
router.get(
  "/customers/:customerId/wishlist",
  authenticateCustomer,
  async (req: CustomerAuthRequest, res: Response) => {
    const { customerId } = req.params;

    if (!req.customer || req.customer.id !== customerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const repository = AppDataSource.getRepository(Wishlist);
    let wishlist = await repository.findOne({ where: { customerId } });

    if (!wishlist) {
      wishlist = new Wishlist();
      wishlist.customerId = customerId;
      wishlist.productIds = [];
      await repository.save(wishlist);
    }

    res.json({ success: true, data: wishlist });
  }
);

// Add item to wishlist
router.post(
  "/customers/:customerId/wishlist",
  authenticateCustomer,
  async (req: CustomerAuthRequest, res: Response) => {
    const { customerId } = req.params;
    const { productId } = req.body;

    if (!req.customer || req.customer.id !== customerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const repository = AppDataSource.getRepository(Wishlist);
    let wishlist = await repository.findOne({ where: { customerId } });

    if (!wishlist) {
      wishlist = new Wishlist();
      wishlist.customerId = customerId;
      wishlist.productIds = [];
    }

    if (!wishlist.productIds.includes(productId)) {
      wishlist.productIds.push(productId);
    }

    await repository.save(wishlist);
    res.json({ success: true, data: wishlist });
  }
);

// Remove item from wishlist
router.delete(
  "/customers/:customerId/wishlist/:productId",
  authenticateCustomer,
  async (req: CustomerAuthRequest, res: Response) => {
    const { customerId, productId } = req.params;

    if (!req.customer || req.customer.id !== customerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const repository = AppDataSource.getRepository(Wishlist);
    const wishlist = await repository.findOne({ where: { customerId } });

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    wishlist.productIds = wishlist.productIds.filter((id) => id !== productId);
    await repository.save(wishlist);

    res.json({ success: true, data: wishlist });
  }
);

export default router;
