import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PaymentIntent, PaymentIntentStatus, PaymentIntentCaptureMethod } from "../entities/PaymentIntent";
import { SavedPaymentMethod } from "../entities/SavedPaymentMethod";
import { Customer } from "../entities/Customer";
import { Order } from "../entities/Order";
import { authenticate, authorize, AuthRequest } from "../middleware/rbac";
import { Permission } from "../enums/permission";
import { validate } from "class-validator";
import { StripeService } from "../services/StripeService";
import { PayPalService } from "../services/PayPalService";

const router = Router();

// Initialize payment services
const stripeService = new StripeService();
const paypalService = new PayPalService();

// Create payment intent
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      amount,
      currency,
      customerId,
      orderId,
      paymentMethodId,
      captureMethod = PaymentIntentCaptureMethod.AUTOMATIC,
      description,
      receiptEmail,
      gateway = "stripe", // Default to Stripe
      metadata = {},
      shippingAddress,
    } = req.body;

    // Validate required fields
    if (!amount || !currency || !customerId) {
      return res.status(400).json({
        error: "Amount, currency, and customerId are required",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than 0",
        code: "INVALID_AMOUNT"
      });
    }

    const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
    const customerRepository = AppDataSource.getRepository(Customer);

    // Verify customer exists
    const customer = await customerRepository.findOne({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
        code: "CUSTOMER_NOT_FOUND"
      });
    }

    // Verify order exists if provided
    if (orderId) {
      const orderRepository = AppDataSource.getRepository(Order);
      const order = await orderRepository.findOne({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          code: "ORDER_NOT_FOUND"
        });
      }
    }

    // Create payment intent entity
    const paymentIntent = new PaymentIntent();
    paymentIntent.customerId = customerId;
    paymentIntent.orderId = orderId;
    paymentIntent.amount = amount;
    paymentIntent.currency = currency.toUpperCase();
    paymentIntent.captureMethod = captureMethod;
    paymentIntent.paymentMethodId = paymentMethodId;
    paymentIntent.gateway = gateway;
    paymentIntent.description = description;
    paymentIntent.receiptEmail = receiptEmail;
    paymentIntent.metadata = metadata;
    paymentIntent.shippingAddress = shippingAddress;

    // Validate payment intent
    const errors = await validate(paymentIntent);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    let gatewayResponse;
    let clientSecret: string | undefined;

    try {
      // Create payment intent with the specified gateway
      if (gateway === "stripe") {
        const stripeResult = await stripeService.createPaymentIntent({
          amount,
          currency,
          customerId: customer.id,
          paymentMethodId,
          captureMethod,
          description,
          metadata,
          receiptEmail,
          shippingAddress,
        });

        gatewayResponse = stripeResult.paymentIntent;
        clientSecret = stripeResult.clientSecret;
        paymentIntent.stripePaymentIntentId = stripeResult.paymentIntent.id;
        paymentIntent.status = stripeService.convertPaymentIntentStatus(stripeResult.paymentIntent.status);

      } else if (gateway === "paypal") {
        const paypalResult = await paypalService.createOrder({
          amount,
          currency,
          customerId,
          description,
          metadata,
        });

        gatewayResponse = paypalResult;
        paymentIntent.paypalOrderId = paypalResult.id;
        paymentIntent.status = paypalService.convertOrderStatus(paypalResult.status);

      } else {
        return res.status(400).json({
          error: "Unsupported payment gateway",
          code: "UNSUPPORTED_GATEWAY"
        });
      }

      paymentIntent.clientSecret = clientSecret;

      // Save payment intent
      await paymentIntentRepository.save(paymentIntent);

      // Prepare response
      const response: any = {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        gateway: paymentIntent.gateway,
        captureMethod: paymentIntent.captureMethod,
        createdAt: paymentIntent.createdAt,
      };

      if (clientSecret) {
        response.clientSecret = clientSecret;
      }

      if (gateway === "paypal" && gatewayResponse.links) {
        response.approvalUrl = gatewayResponse.links.find((link: any) => link.rel === "approve")?.href;
      }

      res.status(201).json(response);

    } catch (gatewayError) {
      logger.error(`${gateway} payment intent creation failed:`, gatewayError);
      
      // Still save the payment intent with failed status
      paymentIntent.status = PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
      paymentIntent.lastPaymentError = {
        type: "gateway_error",
        message: gatewayError.message,
      };
      await paymentIntentRepository.save(paymentIntent);

      return res.status(400).json({
        error: `Payment gateway error: ${gatewayError.message}`,
        code: "GATEWAY_ERROR"
      });
    }

  } catch (error) {
    logger.error("Payment intent creation error:", error);
    res.status(500).json({
      error: "Failed to create payment intent",
      code: "PAYMENT_INTENT_CREATION_ERROR"
    });
  }
});

// Get payment intent by ID
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
    const paymentIntent = await paymentIntentRepository.findOne({
      where: { id }
    });

    if (!paymentIntent) {
      return res.status(404).json({
        error: "Payment intent not found",
        code: "PAYMENT_INTENT_NOT_FOUND"
      });
    }

    // Check if user has permission to view this payment intent
    const user = req.user!;
    if (!user.isStaff() && paymentIntent.customerId !== user.id.toString()) {
      return res.status(403).json({
        error: "Access denied",
        code: "ACCESS_DENIED"
      });
    }

    res.json({
      id: paymentIntent.id,
      customerId: paymentIntent.customerId,
      orderId: paymentIntent.orderId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      gateway: paymentIntent.gateway,
      captureMethod: paymentIntent.captureMethod,
      description: paymentIntent.description,
      receiptEmail: paymentIntent.receiptEmail,
      metadata: paymentIntent.metadata,
      shippingAddress: paymentIntent.shippingAddress,
      clientSecret: paymentIntent.clientSecret,
      lastPaymentError: paymentIntent.lastPaymentError,
      nextAction: paymentIntent.nextAction,
      charges: paymentIntent.charges,
      createdAt: paymentIntent.createdAt,
      updatedAt: paymentIntent.updatedAt,
    });

  } catch (error) {
    logger.error("Get payment intent error:", error);
    res.status(500).json({
      error: "Failed to retrieve payment intent",
      code: "PAYMENT_INTENT_RETRIEVAL_ERROR"
    });
  }
});

// Confirm payment intent
router.post("/:id/confirm", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethodId, returnUrl } = req.body;

    const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
    const paymentIntent = await paymentIntentRepository.findOne({
      where: { id }
    });

    if (!paymentIntent) {
      return res.status(404).json({
        error: "Payment intent not found",
        code: "PAYMENT_INTENT_NOT_FOUND"
      });
    }

    // Check if user has permission to confirm this payment intent
    const user = req.user!;
    if (!user.isStaff() && paymentIntent.customerId !== user.id.toString()) {
      return res.status(403).json({
        error: "Access denied",
        code: "ACCESS_DENIED"
      });
    }

    if (!paymentIntent.canBeConfirmed()) {
      return res.status(400).json({
        error: "Payment intent cannot be confirmed in current status",
        code: "INVALID_STATUS_FOR_CONFIRMATION",
        currentStatus: paymentIntent.status
      });
    }

    try {
      let gatewayResponse;

      if (paymentIntent.gateway === "stripe" && paymentIntent.stripePaymentIntentId) {
        gatewayResponse = await stripeService.confirmPaymentIntent(
          paymentIntent.stripePaymentIntentId,
          paymentMethodId,
          returnUrl
        );

        paymentIntent.status = stripeService.convertPaymentIntentStatus(gatewayResponse.status);
        
        if (gatewayResponse.next_action) {
          paymentIntent.nextAction = {
            type: gatewayResponse.next_action.type,
            redirectToUrl: gatewayResponse.next_action.redirect_to_url,
            useStripeSdk: gatewayResponse.next_action.use_stripe_sdk,
          };
        }

        if (gatewayResponse.last_payment_error) {
          paymentIntent.lastPaymentError = {
            type: gatewayResponse.last_payment_error.type,
            code: gatewayResponse.last_payment_error.code,
            message: gatewayResponse.last_payment_error.message,
            declineCode: gatewayResponse.last_payment_error.decline_code,
          };
        }

      } else if (paymentIntent.gateway === "paypal" && paymentIntent.paypalOrderId) {
        // For PayPal, confirmation is typically handled on the frontend
        // We'll capture the order here if it's approved
        gatewayResponse = await paypalService.captureOrder(paymentIntent.paypalOrderId);
        paymentIntent.status = paypalService.convertOrderStatus(gatewayResponse.status);

      } else {
        return res.status(400).json({
          error: "Invalid gateway or missing gateway payment ID",
          code: "INVALID_GATEWAY_CONFIG"
        });
      }

      await paymentIntentRepository.save(paymentIntent);

      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        nextAction: paymentIntent.nextAction,
        lastPaymentError: paymentIntent.lastPaymentError,
        gatewayResponse: {
          id: gatewayResponse.id,
          status: gatewayResponse.status,
        },
      });

    } catch (gatewayError) {
      logger.error(`${paymentIntent.gateway} confirmation failed:`, gatewayError);

      paymentIntent.lastPaymentError = {
        type: "gateway_error",
        message: gatewayError.message,
      };
      await paymentIntentRepository.save(paymentIntent);

      return res.status(400).json({
        error: `Payment confirmation failed: ${gatewayError.message}`,
        code: "CONFIRMATION_FAILED"
      });
    }

  } catch (error) {
    logger.error("Payment intent confirmation error:", error);
    res.status(500).json({
      error: "Failed to confirm payment intent",
      code: "PAYMENT_INTENT_CONFIRMATION_ERROR"
    });
  }
});

// Capture payment intent (for manual capture)
router.post("/:id/capture", authenticate, authorize([Permission.PAYMENT_PROCESS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amountToCapture } = req.body;

    const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
    const paymentIntent = await paymentIntentRepository.findOne({
      where: { id }
    });

    if (!paymentIntent) {
      return res.status(404).json({
        error: "Payment intent not found",
        code: "PAYMENT_INTENT_NOT_FOUND"
      });
    }

    if (!paymentIntent.requiresCapture()) {
      return res.status(400).json({
        error: "Payment intent does not require capture",
        code: "INVALID_STATUS_FOR_CAPTURE",
        currentStatus: paymentIntent.status
      });
    }

    try {
      let gatewayResponse;

      if (paymentIntent.gateway === "stripe" && paymentIntent.stripePaymentIntentId) {
        gatewayResponse = await stripeService.capturePaymentIntent(
          paymentIntent.stripePaymentIntentId,
          amountToCapture
        );

        paymentIntent.status = stripeService.convertPaymentIntentStatus(gatewayResponse.status);

      } else if (paymentIntent.gateway === "paypal" && paymentIntent.paypalOrderId) {
        gatewayResponse = await paypalService.captureOrder(paymentIntent.paypalOrderId);
        paymentIntent.status = paypalService.convertOrderStatus(gatewayResponse.status);

      } else {
        return res.status(400).json({
          error: "Invalid gateway or missing gateway payment ID",
          code: "INVALID_GATEWAY_CONFIG"
        });
      }

      await paymentIntentRepository.save(paymentIntent);

      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        amountCaptured: amountToCapture || paymentIntent.amount,
        gatewayResponse: {
          id: gatewayResponse.id,
          status: gatewayResponse.status,
        },
      });

    } catch (gatewayError) {
      logger.error(`${paymentIntent.gateway} capture failed:`, gatewayError);

      return res.status(400).json({
        error: `Payment capture failed: ${gatewayError.message}`,
        code: "CAPTURE_FAILED"
      });
    }

  } catch (error) {
    logger.error("Payment intent capture error:", error);
    res.status(500).json({
      error: "Failed to capture payment intent",
      code: "PAYMENT_INTENT_CAPTURE_ERROR"
    });
  }
});

// Cancel payment intent
router.post("/:id/cancel", authenticate, authorize([Permission.PAYMENT_PROCESS]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
    const paymentIntent = await paymentIntentRepository.findOne({
      where: { id }
    });

    if (!paymentIntent) {
      return res.status(404).json({
        error: "Payment intent not found",
        code: "PAYMENT_INTENT_NOT_FOUND"
      });
    }

    if (!paymentIntent.canBeCanceled()) {
      return res.status(400).json({
        error: "Payment intent cannot be canceled in current status",
        code: "INVALID_STATUS_FOR_CANCELLATION",
        currentStatus: paymentIntent.status
      });
    }

    try {
      let gatewayResponse;

      if (paymentIntent.gateway === "stripe" && paymentIntent.stripePaymentIntentId) {
        gatewayResponse = await stripeService.cancelPaymentIntent(paymentIntent.stripePaymentIntentId);
        paymentIntent.status = stripeService.convertPaymentIntentStatus(gatewayResponse.status);

      } else if (paymentIntent.gateway === "paypal" && paymentIntent.paypalOrderId) {
        // PayPal doesn't have a direct cancel API for orders in some states
        // We'll update our internal status
        paymentIntent.status = PaymentIntentStatus.CANCELED;

      } else {
        return res.status(400).json({
          error: "Invalid gateway or missing gateway payment ID",
          code: "INVALID_GATEWAY_CONFIG"
        });
      }

      await paymentIntentRepository.save(paymentIntent);

      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        message: "Payment intent canceled successfully",
      });

    } catch (gatewayError) {
      logger.error(`${paymentIntent.gateway} cancellation failed:`, gatewayError);

      return res.status(400).json({
        error: `Payment cancellation failed: ${gatewayError.message}`,
        code: "CANCELLATION_FAILED"
      });
    }

  } catch (error) {
    logger.error("Payment intent cancellation error:", error);
    res.status(500).json({
      error: "Failed to cancel payment intent",
      code: "PAYMENT_INTENT_CANCELLATION_ERROR"
    });
  }
});

// Update payment intent status manually
router.patch(
  "/:id/status",
  authenticate,
  authorize([Permission.PAYMENT_PROCESS]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      if (!Object.values(PaymentIntentStatus).includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
      const paymentIntent = await paymentIntentRepository.findOne({ where: { id } });

      if (!paymentIntent) {
        return res.status(404).json({ error: "Payment intent not found" });
      }

      paymentIntent.status = status as PaymentIntentStatus;
      paymentIntent.updatedAt = new Date();

      const updated = await paymentIntentRepository.save(paymentIntent);
      res.json(updated);
    } catch (error) {
      logger.error("Error updating payment intent status:", error);
      res.status(500).json({ error: "Failed to update payment intent status" });
    }
  }
);

// List payment intents (admin only or filtered by customer)
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, status, gateway, orderId, page = 1, limit = 20 } = req.query;
    const user = req.user!;

    const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);
    const queryBuilder = paymentIntentRepository.createQueryBuilder("paymentIntent");

    // Apply filters based on user permissions
    if (!user.isStaff()) {
      // Regular users can only see their own payment intents
      queryBuilder.where("paymentIntent.customerId = :userId", { userId: user.id.toString() });
    } else if (customerId) {
      queryBuilder.where("paymentIntent.customerId = :customerId", { customerId });
    }

    if (status) {
      queryBuilder.andWhere("paymentIntent.status = :status", { status });
    }

    if (gateway) {
      queryBuilder.andWhere("paymentIntent.gateway = :gateway", { gateway });
    }

    if (orderId) {
      queryBuilder.andWhere("paymentIntent.orderId = :orderId", { orderId });
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    queryBuilder
      .orderBy("paymentIntent.createdAt", "DESC")
      .skip(offset)
      .take(limitNum);

    const [paymentIntents, total] = await queryBuilder.getManyAndCount();

    res.json({
      paymentIntents: paymentIntents.map(pi => ({
        id: pi.id,
        customerId: pi.customerId,
        orderId: pi.orderId,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        gateway: pi.gateway,
        description: pi.description,
        createdAt: pi.createdAt,
        updatedAt: pi.updatedAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });

  } catch (error) {
    logger.error("List payment intents error:", error);
    res.status(500).json({
      error: "Failed to list payment intents",
      code: "PAYMENT_INTENTS_LIST_ERROR"
    });
  }
});

export default router;
