import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { WebhookEvent, WebhookEventType, WebhookStatus } from "../entities/WebhookEvent";
import { PaymentIntent, PaymentIntentStatus } from "../entities/PaymentIntent";
import { StripeService } from "../services/StripeService";
import { PayPalService } from "../services/PayPalService";

const router = Router();
const stripeService = new StripeService();
const paypalService = new PayPalService();

// Stripe webhook endpoint
router.post("/stripe", async (req: Request, res: Response) => {
  try {
    const sig = req.get('stripe-signature');
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      logger.error('Missing Stripe signature or webhook secret');
      return res.status(400).json({ error: 'Missing required headers' });
    }

    let event;
    try {
      // Verify webhook signature
      event = stripeService.constructWebhookEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error({ err }, 'Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Log the webhook event
    const webhookRepository = AppDataSource.getRepository(WebhookEvent);
    const webhookEvent = new WebhookEvent();
    webhookEvent.source = 'stripe';
    webhookEvent.type = event.type as WebhookEventType;
    webhookEvent.sourceEventId = event.id;
    webhookEvent.data = event.data.object as any;
    webhookEvent.status = WebhookStatus.PENDING;

    await webhookRepository.save(webhookEvent);

    try {
      // Handle the webhook event
      await handleStripeWebhookEvent(event, webhookEvent.id);
      
      // Update webhook status to processed
      webhookEvent.status = WebhookStatus.SUCCEEDED;
      webhookEvent.processedAt = new Date();
      await webhookRepository.save(webhookEvent);

    } catch (error) {
      logger.error({ err: error }, 'Error processing Stripe webhook');
      
      // Update webhook status to failed
      webhookEvent.status = WebhookStatus.FAILED;
      webhookEvent.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webhookEvent.processedAt = new Date();
      await webhookRepository.save(webhookEvent);

      return res.status(500).json({ error: 'Webhook processing failed' });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'Stripe webhook error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PayPal webhook endpoint
router.post("/paypal", async (req: Request, res: Response) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    
    if (!webhookId) {
      logger.error('Missing PayPal webhook ID');
      return res.status(400).json({ error: 'Webhook not configured' });
    }

    // Verify PayPal webhook signature
    const headers = req.headers as Record<string, string>;
    const isValid = await paypalService.verifyWebhookSignature(
      headers,
      req.body,
      webhookId
    );

    if (!isValid) {
      logger.error('PayPal webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body;

    // Log the webhook event
    const webhookRepository = AppDataSource.getRepository(WebhookEvent);
    const webhookEvent = new WebhookEvent();
    webhookEvent.source = 'paypal';
    webhookEvent.type = webhookData.event_type as WebhookEventType;
    webhookEvent.sourceEventId = webhookData.id;
    webhookEvent.data = webhookData;
    webhookEvent.status = WebhookStatus.PENDING;

    await webhookRepository.save(webhookEvent);

    try {
      // Handle the webhook event
      await handlePayPalWebhookEvent(webhookData, webhookEvent.id);
      
      // Update webhook status to processed
      webhookEvent.status = WebhookStatus.SUCCEEDED;
      webhookEvent.processedAt = new Date();
      await webhookRepository.save(webhookEvent);

    } catch (error) {
      logger.error({ err: error }, 'Error processing PayPal webhook');
      
      // Update webhook status to failed
      webhookEvent.status = WebhookStatus.FAILED;
      webhookEvent.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webhookEvent.processedAt = new Date();
      await webhookRepository.save(webhookEvent);

      return res.status(500).json({ error: 'Webhook processing failed' });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'PayPal webhook error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to handle Stripe webhook events
async function handleStripeWebhookEvent(event: any, webhookEventId: string) {
  const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);

  switch (event.type) {
    case 'payment_intent.succeeded':
      {
        const stripePaymentIntent = event.data.object;
        const paymentIntent = await paymentIntentRepository.findOne({
          where: { stripePaymentIntentId: stripePaymentIntent.id }
        });

        if (paymentIntent) {
          paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
          paymentIntent.updatedAt = new Date();
          await paymentIntentRepository.save(paymentIntent);

          logger.info(`Payment intent ${paymentIntent.id} succeeded via webhook`);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      {
        const stripePaymentIntent = event.data.object;
        const paymentIntent = await paymentIntentRepository.findOne({
          where: { stripePaymentIntentId: stripePaymentIntent.id }
        });

        if (paymentIntent) {
          paymentIntent.status = PaymentIntentStatus.CANCELED; // Using CANCELED as there's no FAILED status
          paymentIntent.updatedAt = new Date();
          await paymentIntentRepository.save(paymentIntent);

          logger.info(`Payment intent ${paymentIntent.id} failed via webhook`);
        }
      }
      break;

    case 'payment_intent.canceled':
      {
        const stripePaymentIntent = event.data.object;
        const paymentIntent = await paymentIntentRepository.findOne({
          where: { stripePaymentIntentId: stripePaymentIntent.id }
        });

        if (paymentIntent) {
          paymentIntent.status = PaymentIntentStatus.CANCELED;
          paymentIntent.updatedAt = new Date();
          await paymentIntentRepository.save(paymentIntent);

          logger.info(`Payment intent ${paymentIntent.id} canceled via webhook`);
        }
      }
      break;

    case 'payment_intent.requires_action':
      {
        const stripePaymentIntent = event.data.object;
        const paymentIntent = await paymentIntentRepository.findOne({
          where: { stripePaymentIntentId: stripePaymentIntent.id }
        });

        if (paymentIntent) {
          paymentIntent.status = PaymentIntentStatus.REQUIRES_ACTION;
          paymentIntent.updatedAt = new Date();
          await paymentIntentRepository.save(paymentIntent);

          logger.info(`Payment intent ${paymentIntent.id} requires action via webhook`);
        }
      }
      break;

    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }
}

// Helper function to handle PayPal webhook events
async function handlePayPalWebhookEvent(webhookData: any, webhookEventId: string) {
  const paymentIntentRepository = AppDataSource.getRepository(PaymentIntent);

  switch (webhookData.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      {
        const resource = webhookData.resource;
        // PayPal order ID is typically in the custom_id or invoice_id
        const orderId = resource.custom_id || resource.invoice_id;
        
        if (orderId) {
          const paymentIntent = await paymentIntentRepository.findOne({
            where: { paypalOrderId: orderId }
          });

          if (paymentIntent) {
            paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
            paymentIntent.updatedAt = new Date();
            await paymentIntentRepository.save(paymentIntent);

            logger.info(`PayPal payment intent ${paymentIntent.id} succeeded via webhook`);
          }
        }
      }
      break;

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.DECLINED':
      {
        const resource = webhookData.resource;
        const orderId = resource.custom_id || resource.invoice_id;
        
        if (orderId) {
          const paymentIntent = await paymentIntentRepository.findOne({
            where: { paypalOrderId: orderId }
          });

          if (paymentIntent) {
            paymentIntent.status = PaymentIntentStatus.CANCELED; // Using CANCELED as there's no FAILED status
            paymentIntent.updatedAt = new Date();
            await paymentIntentRepository.save(paymentIntent);

            logger.info(`PayPal payment intent ${paymentIntent.id} failed via webhook`);
          }
        }
      }
      break;

    case 'CHECKOUT.ORDER.APPROVED':
      {
        const resource = webhookData.resource;
        const orderId = resource.id;
        
        const paymentIntent = await paymentIntentRepository.findOne({
          where: { paypalOrderId: orderId }
        });

        if (paymentIntent) {
          paymentIntent.status = PaymentIntentStatus.REQUIRES_CONFIRMATION;
          paymentIntent.updatedAt = new Date();
          await paymentIntentRepository.save(paymentIntent);

          logger.info(`PayPal payment intent ${paymentIntent.id} approved and requires confirmation via webhook`);
        }
      }
      break;

    default:
      logger.info(`Unhandled PayPal event type: ${webhookData.event_type}`);
  }
}

// Get webhook events for debugging (admin only)
router.get("/events", async (req: Request, res: Response) => {
  try {
    const {
      source,
      type,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const repository = AppDataSource.getRepository(WebhookEvent);
    const queryBuilder = repository.createQueryBuilder("we");

    if (source) {
      queryBuilder.andWhere("we.source = :source", { source });
    }

    if (type) {
      queryBuilder.andWhere("we.type = :type", { type });
    }

    if (status) {
      queryBuilder.andWhere("we.status = :status", { status });
    }

    const totalCount = await queryBuilder.getCount();
    
    const events = await queryBuilder
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .orderBy("we.createdAt", "DESC")
      .getMany();

    res.json({
      success: true,
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching webhook events");
    res.status(500).json({
      success: false,
      error: "Failed to fetch webhook events"
    });
  }
});

// Retry failed webhook event processing
router.post("/events/:eventId/retry", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const repository = AppDataSource.getRepository(WebhookEvent);

    const webhookEvent = await repository.findOne({
      where: { id: eventId }
    });

    if (!webhookEvent) {
      return res.status(404).json({
        success: false,
        error: "Webhook event not found"
      });
    }

    if (webhookEvent.status !== WebhookStatus.FAILED) {
      return res.status(400).json({
        success: false,
        error: "Only failed events can be retried"
      });
    }

    // Reset status to pending
    webhookEvent.status = WebhookStatus.PENDING;
    webhookEvent.errorMessage = undefined;
    await repository.save(webhookEvent);

    try {
      // Retry processing based on provider
      if (webhookEvent.source === 'stripe') {
        await handleStripeWebhookEvent(webhookEvent.data, webhookEvent.id);
      } else if (webhookEvent.source === 'paypal') {
        await handlePayPalWebhookEvent(webhookEvent.data, webhookEvent.id);
      }

      // Update status to processed
      webhookEvent.status = WebhookStatus.SUCCEEDED;
      webhookEvent.processedAt = new Date();
      await repository.save(webhookEvent);

      res.json({
        success: true,
        message: "Webhook event processed successfully"
      });
    } catch (error) {
      // Update status back to failed
      webhookEvent.status = WebhookStatus.FAILED;
      webhookEvent.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webhookEvent.processedAt = new Date();
      await repository.save(webhookEvent);

      res.status(500).json({
        success: false,
        error: "Failed to process webhook event"
      });
    }
  } catch (error) {
    logger.error({ err: error }, "Error retrying webhook event");
    res.status(500).json({
      success: false,
      error: "Failed to retry webhook event"
    });
  }
});

export default router;
