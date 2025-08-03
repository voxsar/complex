import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Payment } from "../entities/Payment";
import { PaymentStatus } from "../enums/payment_status";
import { validate } from "class-validator";

const router = Router();

// Get all payments
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      orderId,
      customerId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (orderId) {
      query.orderId = orderId;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get payments
    const [payments, total] = await Promise.all([
      paymentRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      paymentRepository.count({ where: query })
    ]);

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Get payment by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentRepository = AppDataSource.getRepository(Payment);

    const payment = await paymentRepository.findOne({
      where: { id }
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// Create payment
router.post("/", async (req: Request, res: Response) => {
  try {
    const paymentRepository = AppDataSource.getRepository(Payment);
    
    const payment = paymentRepository.create(req.body);
    
    // Validate
    const errors = await validate(payment);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedPayment = await paymentRepository.save(payment);
    res.status(201).json(savedPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// Update payment status
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, failureReason } = req.body;
    const paymentRepository = AppDataSource.getRepository(Payment);

    const payment = await paymentRepository.findOne({
      where: { id }
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = status;
    if (failureReason) {
      payment.failureReason = failureReason;
    }

    const updatedPayment = await paymentRepository.save(payment);
    res.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// Refund payment
router.post("/:id/refund", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const paymentRepository = AppDataSource.getRepository(Payment);

    const payment = await paymentRepository.findOne({
      where: { id }
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      return res.status(400).json({ error: "Cannot refund non-completed payment" });
    }

    const refundAmount = amount || payment.amount;
    const maxRefund = payment.amount - payment.refundedAmount;

    if (refundAmount > maxRefund) {
      return res.status(400).json({ error: "Refund amount exceeds available amount" });
    }

    payment.refundedAmount += refundAmount;
    
    if (payment.refundedAmount >= payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    const updatedPayment = await paymentRepository.save(payment);
    res.json(updatedPayment);
  } catch (error) {
    console.error("Error refunding payment:", error);
    res.status(500).json({ error: "Failed to refund payment" });
  }
});

export default router;
