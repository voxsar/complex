import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Order } from "../entities/Order";
import { OrderStatus } from "../enums/order_status";
import { OrderFinancialStatus } from "../enums/order_financial_status";
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

// Add payment to order
router.post("/:id/payments", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, currency, method, reference, gatewayTransactionId, gatewayResponse } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payment = order.addPayment({
      amount,
      currency: currency || order.currency,
      status: 'pending',
      method,
      reference,
      gatewayTransactionId,
      gatewayResponse
    });

    const updatedOrder = await orderRepository.save(order);

    res.json({
      message: "Payment added successfully",
      order: updatedOrder,
      payment
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ error: "Failed to add payment" });
  }
});

// Update payment status
router.patch("/:id/payments/:paymentId", async (req: Request, res: Response) => {
  try {
    const { id, paymentId } = req.params;
    const { status, gatewayResponse, failureReason } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payment = order.payments?.find(p => p.id === paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    order.updatePaymentStatus(paymentId, status, {
      ...(gatewayResponse && { gatewayResponse }),
      ...(failureReason && { failureReason }),
      ...(status === 'paid' && { processedAt: new Date() })
    });

    const updatedOrder = await orderRepository.save(order);

    res.json({
      message: "Payment status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

// Add fulfillment to order
router.post("/:id/fulfillments", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, trackingCompany, trackingNumber, estimatedDelivery } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate fulfillment items
    const validItems = items.filter((item: any) => 
      order.items.some(orderItem => orderItem.id === item.orderItemId)
    );

    if (validItems.length === 0) {
      return res.status(400).json({ error: "No valid items found for fulfillment" });
    }

    const fulfillment = order.addFulfillment({
      status: 'pending',
      trackingCompany,
      trackingNumber,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      items: validItems.map((item: any) => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity
      }))
    });

    const updatedOrder = await orderRepository.save(order);

    res.json({
      message: "Fulfillment added successfully",
      order: updatedOrder,
      fulfillment
    });
  } catch (error) {
    console.error("Error adding fulfillment:", error);
    res.status(500).json({ error: "Failed to add fulfillment" });
  }
});

// Update fulfillment status
router.patch("/:id/fulfillments/:fulfillmentId", async (req: Request, res: Response) => {
  try {
    const { id, fulfillmentId } = req.params;
    const { status, trackingNumber, trackingCompany, estimatedDelivery } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const fulfillmentIndex = order.fulfillments?.findIndex(f => f.id === fulfillmentId);
    if (fulfillmentIndex === -1 || fulfillmentIndex === undefined) {
      return res.status(404).json({ error: "Fulfillment not found" });
    }

    // Update fulfillment
    order.fulfillments[fulfillmentIndex] = {
      ...order.fulfillments[fulfillmentIndex],
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(trackingCompany && { trackingCompany }),
      ...(estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) }),
      ...(status === 'shipped' && { shippedAt: new Date() }),
      ...(status === 'delivered' && { deliveredAt: new Date() })
    };

    const updatedOrder = await orderRepository.save(order);

    res.json({
      message: "Fulfillment status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating fulfillment status:", error);
    res.status(500).json({ error: "Failed to update fulfillment status" });
  }
});

// Get order financial summary
router.get("/:id/financial-summary", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const summary = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currency: order.currency,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      totalPaid: order.totalPaid,
      totalRefunded: order.totalRefunded,
      remainingBalance: order.remainingBalance,
      isPaid: order.isPaid,
      payments: order.payments || [],
      paymentMethods: [...new Set(order.payments?.map(p => p.method) || [])],
      lastPaymentAt: order.payments?.reduce((latest, payment) => {
        const paymentDate = payment.processedAt || payment.createdAt;
        return !latest || paymentDate > latest ? paymentDate : latest;
      }, null as Date | null)
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({ error: "Failed to fetch financial summary" });
  }
});

// Get order fulfillment summary
router.get("/:id/fulfillment-summary", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const totalItems = order.itemsCount;
    const fulfilledItems = order.fulfillments?.reduce((sum, fulfillment) => {
      if (fulfillment.status === 'fulfilled' || fulfillment.status === 'delivered') {
        return sum + fulfillment.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }
      return sum;
    }, 0) || 0;

    const summary = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      fulfillmentStatus: order.fulfillmentStatus,
      totalItems,
      fulfilledItems,
      remainingItems: totalItems - fulfilledItems,
      isFulfilled: order.isFulfilled,
      fulfillments: order.fulfillments || [],
      trackingNumbers: order.fulfillments?.filter(f => f.trackingNumber).map(f => ({
        fulfillmentId: f.id,
        trackingNumber: f.trackingNumber,
        trackingCompany: f.trackingCompany,
        status: f.status
      })) || [],
      estimatedDeliveries: order.fulfillments?.filter(f => f.estimatedDelivery).map(f => ({
        fulfillmentId: f.id,
        estimatedDelivery: f.estimatedDelivery,
        status: f.status
      })) || []
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching fulfillment summary:", error);
    res.status(500).json({ error: "Failed to fetch fulfillment summary" });
  }
});

// Get order returns, claims, and exchanges
router.get("/:id/returns-claims-exchanges", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const summary = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      hasReturns: order.hasReturns,
      hasClaims: order.hasClaims,
      hasExchanges: order.hasExchanges,
      returnIds: order.returnIds || [],
      claimIds: order.claimIds || [],
      exchangeIds: order.exchangeIds || [],
      counts: {
        returns: order.returnIds?.length || 0,
        claims: order.claimIds?.length || 0,
        exchanges: order.exchangeIds?.length || 0
      }
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching returns/claims/exchanges summary:", error);
    res.status(500).json({ error: "Failed to fetch returns/claims/exchanges summary" });
  }
});

// Capture order payment
router.post("/:id/capture-payment", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentId, amount } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payment = order.payments?.find(p => p.id === paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== 'authorized') {
      return res.status(400).json({ error: "Payment must be authorized before capture" });
    }

    const captureAmount = amount || payment.amount;
    
    // Update payment status
    order.updatePaymentStatus(paymentId, 'captured', {
      capturedAt: new Date(),
      capturedAmount: captureAmount
    });

    // Update order financial status
    const totalCaptured = order.payments.reduce((sum, p) => 
      p.status === 'captured' ? sum + p.amount : sum, 0);
    
    if (totalCaptured >= order.total) {
      order.financialStatus = OrderFinancialStatus.PAID;
    } else {
      order.financialStatus = OrderFinancialStatus.PARTIALLY_PAID;
    }

    const updatedOrder = await orderRepository.save(order);

    res.json({
      message: "Payment captured successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error capturing payment:", error);
    res.status(500).json({ error: "Failed to capture payment" });
  }
});

// Refund order payment
router.post("/:id/refund-payment", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentId, amount, note } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payment = order.payments?.find(p => p.id === paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== 'captured' && payment.status !== 'paid') {
      return res.status(400).json({ error: "Cannot refund non-captured payment" });
    }

    const refundAmount = amount || (payment.amount - (payment.refundedAmount || 0));
    const maxRefund = payment.amount - (payment.refundedAmount || 0);

    if (refundAmount > maxRefund) {
      return res.status(400).json({ error: "Refund amount exceeds available amount" });
    }

    // Add refund
    order.addRefund(paymentId, refundAmount);

    // Update order financial status
    const totalRefunded = order.totalRefunded;
    
    if (totalRefunded >= order.total) {
      order.financialStatus = OrderFinancialStatus.REFUNDED;
    } else if (totalRefunded > 0) {
      order.financialStatus = OrderFinancialStatus.PARTIALLY_REFUNDED;
    }

    const updatedOrder = await orderRepository.save(order);

    res.json({
      message: "Payment refunded successfully",
      order: updatedOrder,
      refundAmount
    });
  } catch (error) {
    console.error("Error refunding payment:", error);
    res.status(500).json({ error: "Failed to refund payment" });
  }
});

// Mark order as paid manually
router.post("/:id/mark-paid", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const outstandingAmount = order.remainingBalance;
    
    if (outstandingAmount <= 0) {
      return res.status(400).json({ error: "No outstanding amount to mark as paid" });
    }

    // Add manual payment
    const payment = order.addPayment({
      amount: outstandingAmount,
      currency: order.currency,
      status: 'paid',
      method: 'manual',
      reference: 'manual-payment',
      metadata: {
        note,
        markedAsPaidAt: new Date().toISOString()
      }
    });

    order.financialStatus = OrderFinancialStatus.PAID;

    const updatedOrder = await orderRepository.save(order);

    res.json({
      message: "Order marked as paid successfully",
      order: updatedOrder,
      payment
    });
  } catch (error) {
    console.error("Error marking order as paid:", error);
    res.status(500).json({ error: "Failed to mark order as paid" });
  }
});

// Generate payment link for outstanding amount
router.get("/:id/payment-link", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const outstandingAmount = order.remainingBalance;
    
    if (outstandingAmount <= 0) {
      return res.status(400).json({ error: "No outstanding amount for payment link" });
    }

    // Generate a payment link (this would typically integrate with your payment provider)
    const paymentLink = `${process.env.STOREFRONT_URL || 'http://localhost:3001'}/checkout/payment/${order.id}?amount=${outstandingAmount}`;

    res.json({
      paymentLink,
      outstandingAmount,
      currency: order.currency,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error("Error generating payment link:", error);
    res.status(500).json({ error: "Failed to generate payment link" });
  }
});

// Get order outstanding amounts
router.get("/:id/outstanding", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const outstandingAmount = order.remainingBalance;
    const totalPaid = order.totalPaid;
    const totalRefunded = order.totalRefunded;

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      totalPaid,
      totalRefunded,
      outstandingAmount,
      currency: order.currency,
      financialStatus: order.financialStatus,
      payments: order.payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        refundedAmount: p.refundedAmount || 0,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching outstanding amounts:", error);
    res.status(500).json({ error: "Failed to fetch outstanding amounts" });
  }
});

export default router;
