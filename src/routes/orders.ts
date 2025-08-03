import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Order } from "../entities/Order";
import { OrderStatus } from "../enums/order_status";
import { validate } from "class-validator";

const router = Router();

// Get all orders
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const orderRepository = AppDataSource.getRepository(Order);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "billingAddress.firstName": { $regex: search, $options: "i" } },
        { "billingAddress.lastName": { $regex: search, $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get orders
    const [orders, total] = await Promise.all([
      orderRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      orderRepository.count({ where: query })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get order by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderRepository = AppDataSource.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Create order
router.post("/", async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    
    const order = orderRepository.create(req.body);
    
    // Validate
    const errors = await validate(order);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedOrder = await orderRepository.save(order);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Update order
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderRepository = AppDataSource.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update fields
    Object.assign(order, req.body);
    
    // Validate
    const errors = await validate(order);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedOrder = await orderRepository.save(order);
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Cancel order
router.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const orderRepository = AppDataSource.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    const updatedOrder = await orderRepository.save(order);
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

export default router;
