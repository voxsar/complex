import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { OrderExchange } from "../entities/OrderExchange";
import { Order } from "../entities/Order";
import { ExchangeStatus } from "../enums/exchange_status";

const router = Router();

// Get all exchanges with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      orderId,
      customerId,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const exchangeRepository = AppDataSource.getRepository(OrderExchange);
    
    const query: any = {};
    
    if (status) query.status = status;
    if (orderId) query.orderId = orderId;
    if (customerId) query.customerId = customerId;

    const [exchanges, total] = await exchangeRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { [sortBy as string]: sortOrder === "asc" ? "ASC" : "DESC" }
    });

    res.json({
      exchanges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching exchanges:", error);
    res.status(500).json({ error: "Failed to fetch exchanges" });
  }
});

// Get exchange by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exchangeRepository = AppDataSource.getRepository(OrderExchange);
    
    const exchange = await exchangeRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!exchange) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    res.json(exchange);
  } catch (error) {
    console.error("Error fetching exchange:", error);
    res.status(500).json({ error: "Failed to fetch exchange" });
  }
});

// Create new exchange request
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      customerId,
      returnItems,
      exchangeItems,
      reason,
      customerNote,
      shippingAddress
    } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const exchangeRepository = AppDataSource.getRepository(OrderExchange);

    // Verify order exists
    const order = await orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate return items against order items
    const validReturnItems = returnItems.filter((item: any) => 
      order.items.some(orderItem => orderItem.id === item.orderItemId)
    );

    if (validReturnItems.length === 0) {
      return res.status(400).json({ error: "No valid items found for return" });
    }

    // Calculate amounts
    const returnValue = validReturnItems.reduce((sum: number, item: any) => {
      const orderItem = order.items.find(oi => oi.id === item.orderItemId);
      return sum + (orderItem ? orderItem.price * item.quantity : 0);
    }, 0);

    const exchangeValue = exchangeItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);

    const netAmount = exchangeValue - returnValue;

    const exchange = new OrderExchange();
    exchange.orderId = orderId;
    exchange.customerId = customerId;
    exchange.reason = reason;
    exchange.customerNote = customerNote;
    exchange.currency = order.currency;
    exchange.shippingAddress = shippingAddress;

    exchange.returnItems = validReturnItems.map((item: any) => ({
      id: `ret_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      reason: item.reason || reason,
      condition: item.condition
    }));

    exchange.exchangeItems = exchangeItems.map((item: any) => ({
      id: `exc_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      productTitle: item.productTitle,
      variantTitle: item.variantTitle
    }));

    if (netAmount > 0) {
      exchange.additionalAmount = netAmount;
      exchange.refundAmount = 0;
    } else {
      exchange.additionalAmount = 0;
      exchange.refundAmount = Math.abs(netAmount);
    }

    const savedExchange = await exchangeRepository.save(exchange);

    // Add exchange reference to order
    order.exchangeIds = [...(order.exchangeIds || []), savedExchange.id];
    await orderRepository.save(order);

    res.status(201).json({
      message: "Exchange request created successfully",
      exchange: savedExchange
    });
  } catch (error) {
    console.error("Error creating exchange:", error);
    res.status(500).json({ error: "Failed to create exchange request" });
  }
});

// Update exchange status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const exchangeRepository = AppDataSource.getRepository(OrderExchange);
    
    const exchange = await exchangeRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!exchange) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    exchange.status = status;
    if (adminNote) exchange.adminNote = adminNote;

    // Set timestamps based on status
    const now = new Date();
    switch (status) {
      case ExchangeStatus.PROCESSED:
        exchange.processedAt = now;
        break;
      case ExchangeStatus.IN_TRANSIT:
        exchange.shippedAt = now;
        break;
      case ExchangeStatus.COMPLETED:
        exchange.completedAt = now;
        break;
    }

    const updatedExchange = await exchangeRepository.save(exchange);

    res.json({
      message: "Exchange status updated successfully",
      exchange: updatedExchange
    });
  } catch (error) {
    console.error("Error updating exchange status:", error);
    res.status(500).json({ error: "Failed to update exchange status" });
  }
});

// Approve exchange
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const exchangeRepository = AppDataSource.getRepository(OrderExchange);
    
    const exchange = await exchangeRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!exchange) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    if (exchange.status !== ExchangeStatus.REQUESTED) {
      return res.status(400).json({ error: "Exchange cannot be approved in current status" });
    }

    exchange.status = ExchangeStatus.APPROVED;
    exchange.adminNote = adminNote;

    const updatedExchange = await exchangeRepository.save(exchange);

    res.json({
      message: "Exchange approved successfully",
      exchange: updatedExchange
    });
  } catch (error) {
    console.error("Error approving exchange:", error);
    res.status(500).json({ error: "Failed to approve exchange" });
  }
});

// Process exchange payment
router.post("/:id/payment", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference } = req.body;

    const exchangeRepository = AppDataSource.getRepository(OrderExchange);
    const orderRepository = AppDataSource.getRepository(Order);
    
    const exchange = await exchangeRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!exchange) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    if (exchange.status !== ExchangeStatus.APPROVED) {
      return res.status(400).json({ error: "Exchange must be approved before processing payment" });
    }

    // Get the associated order
    const order = await orderRepository.findOne({
      where: { id: exchange.orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Associated order not found" });
    }

    // Process payment based on net amount
    if (exchange.additionalAmount > 0) {
      // Customer needs to pay additional amount
      order.addPayment({
        amount: exchange.additionalAmount,
        currency: exchange.currency,
        status: 'paid',
        method: paymentMethod,
        reference: paymentReference,
        processedAt: new Date(),
        metadata: { exchangeId: exchange.id, type: 'exchange_payment' }
      });
    } else if (exchange.refundAmount > 0) {
      // Customer should receive refund
      order.addRefund(order.payments[0]?.id || 'manual', exchange.refundAmount);
    }

    await orderRepository.save(order);

    // Update exchange status
    exchange.status = ExchangeStatus.PROCESSED;
    exchange.processedAt = new Date();
    exchange.metadata = {
      ...exchange.metadata,
      payment: {
        method: paymentMethod,
        reference: paymentReference,
        processedAt: new Date()
      }
    };

    const updatedExchange = await exchangeRepository.save(exchange);

    res.json({
      message: "Exchange payment processed successfully",
      exchange: updatedExchange
    });
  } catch (error) {
    console.error("Error processing exchange payment:", error);
    res.status(500).json({ error: "Failed to process exchange payment" });
  }
});

// Delete exchange
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exchangeRepository = AppDataSource.getRepository(OrderExchange);
    
    const exchange = await exchangeRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!exchange) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    if (exchange.status !== ExchangeStatus.REQUESTED) {
      return res.status(400).json({ error: "Only requested exchanges can be deleted" });
    }

    await exchangeRepository.remove(exchange);

    res.json({ message: "Exchange deleted successfully" });
  } catch (error) {
    console.error("Error deleting exchange:", error);
    res.status(500).json({ error: "Failed to delete exchange" });
  }
});

export default router;
