import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Refund, RefundStatus, RefundReason } from "../entities/Refund";
import { PaymentIntent } from "../entities/PaymentIntent";
import { authenticate } from "../middleware/auth";
import { authenticateCustomer } from "../middleware/customerAuth";
import { StripeService } from "../services/StripeService";
import { PayPalService } from "../services/PayPalService";

const router = Router();
const stripeService = new StripeService();
const paypalService = new PayPalService();

interface CreateRefundRequest {
  paymentIntentId: string;
  amount?: number; // If not provided, full amount will be refunded
  reason?: RefundReason;
  description?: string;
  metadata?: Record<string, any>;
}

// Create a refund
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      paymentIntentId,
      amount,
      reason = RefundReason.REQUESTED_BY_CUSTOMER,
      description,
      metadata = {}
    }: CreateRefundRequest = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment intent ID is required"
      });
    }

    // Get the payment intent
    const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
    const paymentIntent = await paymentIntentRepository.findOne({
      where: { id: paymentIntentId }
    });

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        error: "Payment intent not found"
      });
    }

    // Check if payment intent is in a refundable state
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: "Payment intent must be succeeded to create a refund"
      });
    }

    const refundRepository = AppDataSource.getRepository(Refund);

    // Calculate refund amount
    const refundAmount = amount || paymentIntent.amount;

    // Check if refund amount is valid
    if (refundAmount <= 0 || refundAmount > paymentIntent.amount) {
      return res.status(400).json({
        success: false,
        error: "Invalid refund amount"
      });
    }

    // Check total refunded amount doesn't exceed payment amount
    const existingRefunds = await refundRepository.find({
      where: { paymentIntentId }
    });

    const totalRefunded = existingRefunds
      .filter(r => r.status === RefundStatus.SUCCEEDED)
      .reduce((sum, r) => sum + r.amount, 0);

    if (totalRefunded + refundAmount > paymentIntent.amount) {
      return res.status(400).json({
        success: false,
        error: "Refund amount exceeds available refund amount"
      });
    }

    // Create refund entity
    const refund = new Refund();
    refund.paymentIntentId = paymentIntentId;
    refund.amount = refundAmount;
    refund.currency = paymentIntent.currency;
    refund.reason = reason;
    refund.description = description;
    refund.metadata = metadata;
    refund.status = RefundStatus.PENDING;

    await refundRepository.save(refund);

    try {
      let gatewayRefund: any;

      // Process refund through payment gateway
      if (paymentIntent.gateway === 'stripe' && paymentIntent.stripePaymentIntentId) {
        gatewayRefund = await stripeService.createRefund({
          paymentIntentId: paymentIntent.stripePaymentIntentId,
          amount: refundAmount,
          reason: reason === RefundReason.FRAUDULENT ? 'fraudulent' : 'requested_by_customer',
          metadata: {
            refundId: refund.id,
            ...metadata
          }
        });
        refund.stripeRefundId = gatewayRefund.id;
      } else if (paymentIntent.gateway === 'paypal' && paymentIntent.paypalOrderId) {
        gatewayRefund = await paypalService.createRefund({
          captureId: paymentIntent.paypalOrderId,
          amount: refundAmount,
          currency: paymentIntent.currency,
          noteToPayer: description,
          invoiceId: refund.id
        });
        refund.paypalRefundId = gatewayRefund.id;
      } else {
        throw new Error('Unsupported payment gateway or missing gateway payment ID');
      }

      // Update refund status based on gateway response
      if (gatewayRefund.status === 'succeeded' || gatewayRefund.status === 'COMPLETED') {
        refund.status = RefundStatus.SUCCEEDED;
      } else if (gatewayRefund.status === 'failed' || gatewayRefund.status === 'FAILED') {
        refund.status = RefundStatus.FAILED;
        refund.failureReason = gatewayRefund.failure_reason || 'Unknown failure';
      } else {
        refund.status = RefundStatus.PROCESSING;
      }

      await refundRepository.save(refund);

      res.status(201).json({
        success: true,
        data: {
          id: refund.id,
          paymentIntentId: refund.paymentIntentId,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
          description: refund.description,
          metadata: refund.metadata,
          createdAt: refund.createdAt,
          updatedAt: refund.updatedAt
        }
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      
      // Update refund status to failed
      refund.status = RefundStatus.FAILED;
      refund.failureReason = error instanceof Error ? error.message : 'Unknown error';
      await refundRepository.save(refund);

      res.status(500).json({
        success: false,
        error: "Failed to process refund"
      });
    }
  } catch (error) {
    console.error("Error creating refund:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create refund"
    });
  }
});

// Get refund by ID
router.get("/:refundId", authenticate, async (req: Request, res: Response) => {
  try {
    const { refundId } = req.params;
    const repository = AppDataSource.getRepository(Refund);

    const refund = await repository.findOne({
      where: { id: refundId }
    });

    if (!refund) {
      return res.status(404).json({
        success: false,
        error: "Refund not found"
      });
    }

    res.json({
      success: true,
      data: {
        id: refund.id,
        paymentIntentId: refund.paymentIntentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        description: refund.description,
        metadata: refund.metadata,
        stripeRefundId: refund.stripeRefundId,
        paypalRefundId: refund.paypalRefundId,
        failureReason: refund.failureReason,
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching refund:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refund"
    });
  }
});

// Get refunds for a payment intent
router.get("/payment-intent/:paymentIntentId", authenticate, async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;
    const repository = AppDataSource.getRepository(Refund);

    const refunds = await repository.find({
      where: { paymentIntentId },
      order: { createdAt: "DESC" }
    });

    const totalRefunded = refunds
      .filter(r => r.status === RefundStatus.SUCCEEDED)
      .reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      data: {
        refunds: refunds.map(refund => ({
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
          description: refund.description,
          metadata: refund.metadata,
          createdAt: refund.createdAt,
          updatedAt: refund.updatedAt
        })),
        totalRefunded,
        totalRefunds: refunds.length
      }
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refunds"
    });
  }
});

// List all refunds with filtering (admin)
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      status,
      reason,
      paymentIntentId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const repository = AppDataSource.getRepository(Refund);
    const queryBuilder = repository.createQueryBuilder("refund");

    if (status) {
      queryBuilder.andWhere("refund.status = :status", { status });
    }

    if (reason) {
      queryBuilder.andWhere("refund.reason = :reason", { reason });
    }

    if (paymentIntentId) {
      queryBuilder.andWhere("refund.paymentIntentId = :paymentIntentId", { paymentIntentId });
    }

    const totalCount = await queryBuilder.getCount();
    
    const refunds = await queryBuilder
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .orderBy(`refund.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .getMany();

    res.json({
      success: true,
      data: refunds.map(refund => ({
        id: refund.id,
        paymentIntentId: refund.paymentIntentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        description: refund.description,
        metadata: refund.metadata,
        stripeRefundId: refund.stripeRefundId,
        paypalRefundId: refund.paypalRefundId,
        failureReason: refund.failureReason,
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refunds"
    });
  }
});

// Cancel a pending refund
router.post("/:refundId/cancel", authenticate, async (req: Request, res: Response) => {
  try {
    const { refundId } = req.params;
    const repository = AppDataSource.getRepository(Refund);

    const refund = await repository.findOne({
      where: { id: refundId }
    });

    if (!refund) {
      return res.status(404).json({
        success: false,
        error: "Refund not found"
      });
    }

    if (refund.status !== RefundStatus.PENDING && refund.status !== RefundStatus.PROCESSING) {
      return res.status(400).json({
        success: false,
        error: "Only pending or processing refunds can be cancelled"
      });
    }

    try {
      // Cancel refund in payment gateway if possible
      if (refund.stripeRefundId) {
        // Stripe doesn't support canceling refunds once created
        return res.status(400).json({
          success: false,
          error: "Stripe refunds cannot be cancelled once created"
        });
      }

      if (refund.paypalRefundId) {
        // PayPal refund cancellation would be implemented here
        // For now, we'll just mark it as cancelled locally
      }

      refund.status = RefundStatus.CANCELED;
      await repository.save(refund);

      res.json({
        success: true,
        data: {
          id: refund.id,
          status: refund.status,
          updatedAt: refund.updatedAt
        }
      });
    } catch (error) {
      console.error("Error cancelling refund:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cancel refund"
      });
    }
  } catch (error) {
    console.error("Error cancelling refund:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel refund"
    });
  }
});

export default router;
