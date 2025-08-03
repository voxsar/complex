import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Cart } from "../entities/Cart";
import { CartService } from "../utils/cartService";
import { CartToOrderService } from "../utils/cartToOrderService";
import { CartStatus } from "../enums/cart_status";
import { CartType } from "../enums/cart_type";

const router = Router();
const cartService = new CartService();
const cartToOrderService = new CartToOrderService();

// Create a new cart
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      email,
      currency = "USD",
      salesChannelId,
      regionId,
      sessionId,
      type
    } = req.body;

    if (!currency) {
      return res.status(400).json({ error: "Currency is required" });
    }

    const cart = await cartService.createCart({
      customerId,
      email,
      currency,
      salesChannelId,
      regionId,
      sessionId,
      type
    });

    res.status(201).json({ cart });
  } catch (error) {
    console.error("Error creating cart:", error);
    res.status(500).json({ error: "Failed to create cart" });
  }
});

// Get all carts with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      salesChannelId,
      sortBy = "updatedAt",
      sortOrder = "desc"
    } = req.query;

    const cartRepository = AppDataSource.getRepository(Cart);
    
    const query: any = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (salesChannelId) query.salesChannelId = salesChannelId;

    const [carts, total] = await cartRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { [sortBy as string]: sortOrder === "asc" ? "ASC" : "DESC" }
    });

    res.json({
      carts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching carts:", error);
    res.status(500).json({ error: "Failed to fetch carts" });
  }
});

// Get cart by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cart = await cartService.getCart(id);

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.json({ cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Get active cart by customer
router.get("/customer/:customerId/active", async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const cart = await cartService.getActiveCartByCustomer(customerId);

    if (!cart) {
      return res.status(404).json({ error: "No active cart found for customer" });
    }

    res.json({ cart });
  } catch (error) {
    console.error("Error fetching customer cart:", error);
    res.status(500).json({ error: "Failed to fetch customer cart" });
  }
});

// Get active cart by session
router.get("/session/:sessionId/active", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const cart = await cartService.getActiveCartBySession(sessionId);

    if (!cart) {
      return res.status(404).json({ error: "No active cart found for session" });
    }

    res.json({ cart });
  } catch (error) {
    console.error("Error fetching session cart:", error);
    res.status(500).json({ error: "Failed to fetch session cart" });
  }
});

// Add line item to cart
router.post("/:id/line-items", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId, variantId, quantity, metadata } = req.body;

    if (!productId || !variantId || !quantity) {
      return res.status(400).json({ 
        error: "Product ID, variant ID, and quantity are required" 
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    const cart = await cartService.addLineItem(id, {
      productId,
      variantId,
      quantity: Number(quantity),
      metadata
    });

    res.json({ cart });
  } catch (error) {
    console.error("Error adding line item:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to add line item" });
    }
  }
});

// Update line item in cart
router.patch("/:id/line-items/:itemId", async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const { quantity } = req.body;

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ error: "Quantity cannot be negative" });
    }

    const cart = await cartService.updateLineItem(id, itemId, {
      quantity: quantity !== undefined ? Number(quantity) : undefined
    });

    res.json({ cart });
  } catch (error) {
    console.error("Error updating line item:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update line item" });
    }
  }
});

// Remove line item from cart
router.delete("/:id/line-items/:itemId", async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const cart = await cartService.removeLineItem(id, itemId);

    res.json({ cart });
  } catch (error) {
    console.error("Error removing line item:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to remove line item" });
    }
  }
});

// Apply discount to cart
router.post("/:id/discounts", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { promotionId } = req.body;

    if (!promotionId) {
      return res.status(400).json({ error: "Promotion ID is required" });
    }

    const cart = await cartService.applyDiscount(id, promotionId);

    res.json({ cart });
  } catch (error) {
    console.error("Error applying discount:", error);
    if (error.message.includes("not found") || error.message.includes("Invalid")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to apply discount" });
    }
  }
});

// Remove discount from cart
router.delete("/:id/discounts/:discountId", async (req: Request, res: Response) => {
  try {
    const { id, discountId } = req.params;
    const cart = await cartService.removeDiscount(id, discountId);

    res.json({ cart });
  } catch (error) {
    console.error("Error removing discount:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to remove discount" });
    }
  }
});

// Update cart addresses
router.patch("/:id/addresses", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { billingAddress, shippingAddress } = req.body;

    if (!billingAddress && !shippingAddress) {
      return res.status(400).json({ 
        error: "At least one address (billing or shipping) is required" 
      });
    }

    const cart = await cartService.updateAddresses(id, {
      billingAddress,
      shippingAddress
    });

    res.json({ cart });
  } catch (error) {
    console.error("Error updating addresses:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update addresses" });
    }
  }
});

// Set shipping method
router.post("/:id/shipping-methods", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { shippingOptionId, name, price, data } = req.body;

    if (!shippingOptionId || !name || price === undefined) {
      return res.status(400).json({ 
        error: "Shipping option ID, name, and price are required" 
      });
    }

    const cart = await cartService.setShippingMethod(id, {
      shippingOptionId,
      name,
      price: Number(price),
      data
    });

    res.json({ cart });
  } catch (error) {
    console.error("Error setting shipping method:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to set shipping method" });
    }
  }
});

// Update cart details
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      email, 
      currency, 
      salesChannelId, 
      regionId, 
      customerNote,
      metadata 
    } = req.body;

    const cartRepository = AppDataSource.getRepository(Cart);
    const cart = await cartRepository.findOne({ where: { id } });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Update allowed fields
    if (email !== undefined) cart.email = email;
    if (currency !== undefined) cart.currency = currency;
    if (salesChannelId !== undefined) cart.salesChannelId = salesChannelId;
    if (regionId !== undefined) cart.regionId = regionId;
    if (customerNote !== undefined) cart.customerNote = customerNote;
    if (metadata !== undefined) cart.metadata = metadata;

    const updatedCart = await cartRepository.save(cart);

    res.json({ cart: updatedCart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// Complete cart (convert to order)
router.post("/:id/complete", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const cart = await cartService.completeCart(id, orderId);

    res.json({ cart });
  } catch (error) {
    console.error("Error completing cart:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to complete cart" });
    }
  }
});

// Abandon cart
router.post("/:id/abandon", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cart = await cartService.abandonCart(id);

    res.json({ cart });
  } catch (error) {
    console.error("Error abandoning cart:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to abandon cart" });
    }
  }
});

// Delete cart
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cartRepository = AppDataSource.getRepository(Cart);
    
    const cart = await cartRepository.findOne({ where: { id } });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    await cartRepository.remove(cart);

    res.json({ message: "Cart deleted successfully" });
  } catch (error) {
    console.error("Error deleting cart:", error);
    res.status(500).json({ error: "Failed to delete cart" });
  }
});

// Utility endpoint: Clean up expired carts
router.post("/cleanup/expired", async (req: Request, res: Response) => {
  try {
    const count = await cartService.cleanupExpiredCarts();

    res.json({ 
      message: `${count} expired carts cleaned up`,
      count 
    });
  } catch (error) {
    console.error("Error cleaning up expired carts:", error);
    res.status(500).json({ error: "Failed to cleanup expired carts" });
  }
});

// Get checkout summary
router.get("/:id/checkout-summary", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const summary = await cartToOrderService.getCheckoutSummary(id);

    res.json(summary);
  } catch (error) {
    console.error("Error getting checkout summary:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to get checkout summary" });
    }
  }
});

// Validate cart for checkout
router.get("/:id/validate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = await cartToOrderService.validateCartForCheckout(id);

    res.json(validation);
  } catch (error) {
    console.error("Error validating cart:", error);
    res.status(500).json({ error: "Failed to validate cart" });
  }
});

// Create order from cart
router.post("/:id/checkout", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      orderNumber,
      note,
      adminNote,
      tags,
      metadata
    } = req.body;

    // Validate cart first
    const validation = await cartToOrderService.validateCartForCheckout(id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Cart validation failed",
        details: validation.errors
      });
    }

    const order = await cartToOrderService.createOrderFromCart(id, {
      orderNumber,
      note,
      adminNote,
      tags,
      metadata
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error("Error creating order from cart:", error);
    if (error.message.includes("not found") || error.message.includes("required")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create order from cart" });
    }
  }
});

export default router;
