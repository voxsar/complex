import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Wishlist } from "../entities/Wishlist";
import { Product } from "../entities/Product";
import { Order } from "../entities/Order";
import { OrderStatus } from "../enums/order_status";
import { OrderFulfillmentStatus } from "../enums/order_fulfillment_status";
import { OrderFinancialStatus } from "../enums/order_financial_status";
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

// Transfer wishlist item to order
router.post(
  "/customers/:customerId/wishlist/:productId/transfer",
  authenticateCustomer,
  async (req: CustomerAuthRequest, res: Response) => {
    const { customerId, productId } = req.params;

    if (!req.customer || req.customer.id !== customerId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const productRepo = AppDataSource.getRepository(Product);
    const orderRepo = AppDataSource.getRepository(Order);
    const wishlistRepo = AppDataSource.getRepository(Wishlist);

    const product = await productRepo.findOne({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Create a minimal order for the product
    const order = orderRepo.create({
      orderNumber: `WL-${Date.now()}`,
      status: OrderStatus.PENDING,
      fulfillmentStatus: OrderFulfillmentStatus.UNFULFILLED,
      financialStatus: OrderFinancialStatus.PENDING,
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      total: 0,
      currency: "USD",
      tags: [],
      items: [
        {
          id: product.id,
          quantity: 1,
          price: 0,
          total: 0,
          productTitle: product.title,
          variantTitle: "",
        },
      ],
      customerId,
    });

    await orderRepo.save(order);

    // Remove item from wishlist
    const wishlist = await wishlistRepo.findOne({ where: { customerId } });
    if (wishlist) {
      wishlist.productIds = wishlist.productIds.filter((id) => id !== productId);
      await wishlistRepo.save(wishlist);
    }

    res.json({ success: true, data: order });
  }
);

export default router;
