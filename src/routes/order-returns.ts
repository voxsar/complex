import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { OrderReturn } from "../entities/OrderReturn";
import { Order } from "../entities/Order";
import { ReturnStatus } from "../enums/return_status";
import { ReturnReason } from "../enums/return_reason";

const router = Router();

// Get all returns with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      reason,
      orderId,
      customerId,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const returnRepository = AppDataSource.getRepository(OrderReturn);
    
    const query: any = {};
    
    if (status) query.status = status;
    if (reason) query.reason = reason;
    if (orderId) query.orderId = orderId;
    if (customerId) query.customerId = customerId;

    const [returns, total] = await returnRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { [sortBy as string]: sortOrder === "asc" ? "ASC" : "DESC" }
    });

    res.json({
      returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error("Error fetching returns:", error);
    res.status(500).json({ error: "Failed to fetch returns" });
  }
});

// Get return by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const returnRepository = AppDataSource.getRepository(OrderReturn);
    
    const orderReturn = await returnRepository.findOne({
      where: { id: id }
    });

    if (!orderReturn) {
      return res.status(404).json({ error: "Return not found" });
    }

    res.json(orderReturn);
  } catch (error) {
    logger.error("Error fetching return:", error);
    res.status(500).json({ error: "Failed to fetch return" });
  }
});

// Create new return request
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      customerId,
      reason,
      items,
      customerNote,
      refundAmount,
      currency
    } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const returnRepository = AppDataSource.getRepository(OrderReturn);

    // Verify order exists
    const order = await orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate return items against order items
    const validItems = items.filter((item: any) => 
      order.items.some(orderItem => orderItem.id === item.orderItemId)
    );

    if (validItems.length === 0) {
      return res.status(400).json({ error: "No valid items found for return" });
    }

    const orderReturn = new OrderReturn();
    orderReturn.orderId = orderId;
    orderReturn.customerId = customerId;
    orderReturn.reason = reason;
    orderReturn.status = ReturnStatus.REQUESTED; // Explicitly set the status
    orderReturn.items = validItems.map((item: any) => ({
      id: `ret_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      reason: item.reason || reason,
      condition: item.condition,
      restockable: item.restockable !== false,
      refundAmount: item.refundAmount
    }));
    orderReturn.customerNote = customerNote;
    orderReturn.refundAmount = refundAmount;
    orderReturn.currency = currency || order.currency;

    const savedReturn = await returnRepository.save(orderReturn);

    // Add return reference to order
    order.returnIds = [...(order.returnIds || []), savedReturn.id];
    await orderRepository.save(order);

    res.status(201).json({
      message: "Return request created successfully",
      return: savedReturn
    });
  } catch (error) {
    logger.error("Error creating return:", error);
    res.status(500).json({ error: "Failed to create return request" });
  }
});

// Update return status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote, rejectionReason } = req.body;

    const returnRepository = AppDataSource.getRepository(OrderReturn);
    
    const orderReturn = await returnRepository.findOne({
      where: { id: id }
    });

    if (!orderReturn) {
      return res.status(404).json({ error: "Return not found" });
    }

    orderReturn.status = status;
    if (adminNote) orderReturn.adminNote = adminNote;
    if (rejectionReason) orderReturn.rejectionReason = rejectionReason;

    // Set timestamps based on status
    const now = new Date();
    switch (status) {
      case ReturnStatus.PROCESSED:
        orderReturn.processedAt = now;
        break;
      case ReturnStatus.RECEIVED:
        orderReturn.receivedAt = now;
        break;
      case ReturnStatus.REFUNDED:
        orderReturn.refundedAt = now;
        break;
    }

    const updatedReturn = await returnRepository.save(orderReturn);

    res.json({
      message: "Return status updated successfully",
      return: updatedReturn
    });
  } catch (error) {
    logger.error("Error updating return status:", error);
    res.status(500).json({ error: "Failed to update return status" });
  }
});

// Process refund for return
router.post("/:id/refund", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, reference } = req.body;

    const returnRepository = AppDataSource.getRepository(OrderReturn);
    const orderRepository = AppDataSource.getRepository(Order);
    
    const orderReturn = await returnRepository.findOne({
      where: { id: id }
    });

    if (!orderReturn) {
      return res.status(404).json({ error: "Return not found" });
    }

    if (orderReturn.status !== ReturnStatus.APPROVED) {
      return res.status(400).json({ error: "Return must be approved before processing refund" });
    }

    // Get the associated order
    const order = await orderRepository.findOne({
      where: { id: orderReturn.orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Associated order not found" });
    }

    // Add refund to order payments
    order.addRefund(order.payments[0]?.id || 'manual', amount);
    await orderRepository.save(order);

    // Update return status
    orderReturn.status = ReturnStatus.REFUNDED;
    orderReturn.refundedAt = new Date();
    orderReturn.metadata = {
      ...orderReturn.metadata,
      refund: {
        amount,
        method: paymentMethod,
        reference,
        processedAt: new Date()
      }
    };

    const updatedReturn = await returnRepository.save(orderReturn);

    res.json({
      message: "Refund processed successfully",
      return: updatedReturn
    });
  } catch (error) {
    logger.error("Error processing refund:", error);
    res.status(500).json({ error: "Failed to process refund" });
  }
});

// Delete return
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const returnRepository = AppDataSource.getRepository(OrderReturn);
    
    const orderReturn = await returnRepository.findOne({
      where: { id: id }
    });

    if (!orderReturn) {
      return res.status(404).json({ error: "Return not found" });
    }

    if (orderReturn.status !== ReturnStatus.REQUESTED) {
      return res.status(400).json({ error: "Only requested returns can be deleted" });
    }

    await returnRepository.remove(orderReturn);

    res.json({ message: "Return deleted successfully" });
  } catch (error) {
    logger.error("Error deleting return:", error);
    res.status(500).json({ error: "Failed to delete return" });
  }
});

export default router;
