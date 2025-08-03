import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { SavedPaymentMethod, PaymentMethodType } from "../entities/SavedPaymentMethod";
import { Customer } from "../entities/Customer";
import { authenticateCustomer } from "../middleware/customerAuth";
import { authenticate } from "../middleware/auth";
import { StripeService } from "../services/StripeService";
import { PayPalService } from "../services/PayPalService";

const router = Router();
const stripeService = new StripeService();
const paypalService = new PayPalService();

interface SavePaymentMethodRequest {
  type: PaymentMethodType;
  stripePaymentMethodId?: string;
  paypalPaymentMethodId?: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

// Get customer's saved payment methods
router.get(
  "/customers/:customerId/payment-methods",
  authenticateCustomer,
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const repository = AppDataSource.getRepository(SavedPaymentMethod);

      // Verify customer exists and user has access
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({ 
        where: { id: customerId } 
      });
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found"
        });
      }

      // Check if authenticated user can access this customer's data
      // @ts-ignore - req.user is set by authenticateCustomer middleware
      if (req.user.customerId !== customerId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }

      const paymentMethods = await repository.find({
        where: { customerId }
      });

      res.json({
        success: true,
        data: paymentMethods.map(pm => ({
          id: pm.id,
          type: pm.type,
          isDefault: pm.isDefault,
          last4: pm.card?.last4,
          brand: pm.card?.brand,
          expiryMonth: pm.card?.expMonth,
          expiryYear: pm.card?.expYear,
          displayName: pm.getDisplayName(),
          metadata: pm.metadata,
          createdAt: pm.createdAt,
          updatedAt: pm.updatedAt
        }))
      });
    } catch (error) {
      console.error("Error fetching saved payment methods:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch payment methods"
      });
    }
  }
);

// Save a new payment method for a customer
router.post(
  "/customers/:customerId/payment-methods",
  authenticateCustomer,
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const {
        type,
        stripePaymentMethodId,
        paypalPaymentMethodId,
        isDefault = false,
        metadata = {}
      }: SavePaymentMethodRequest = req.body;

      // Verify customer exists and user has access
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({ 
        where: { id: customerId } 
      });
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found"
        });
      }

      // Check if authenticated user can access this customer's data
      // @ts-ignore - req.user is set by authenticateCustomer middleware
      if (req.user.customerId !== customerId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }

      const repository = AppDataSource.getRepository(SavedPaymentMethod);

      // If this is set as default, unset other default payment methods
      if (isDefault) {
        await repository.update(
          { customerId, isDefault: true },
          { isDefault: false }
        );
      }

      let cardDetails: any = undefined;

      // Fetch payment method details from the gateway
      if (type === PaymentMethodType.CARD && stripePaymentMethodId) {
        try {
          const stripePaymentMethod = await stripeService.retrievePaymentMethod(stripePaymentMethodId);
          
          if (stripePaymentMethod.card) {
            cardDetails = {
              last4: stripePaymentMethod.card.last4,
              brand: stripePaymentMethod.card.brand,
              expMonth: stripePaymentMethod.card.exp_month,
              expYear: stripePaymentMethod.card.exp_year,
              country: stripePaymentMethod.card.country,
              funding: stripePaymentMethod.card.funding,
              fingerprint: stripePaymentMethod.card.fingerprint
            };
          }
        } catch (error) {
          console.error("Error fetching Stripe payment method:", error);
          return res.status(400).json({
            success: false,
            error: "Invalid Stripe payment method ID"
          });
        }
      }

      // Create new saved payment method
      const savedPaymentMethod = new SavedPaymentMethod();
      savedPaymentMethod.customerId = customerId;
      savedPaymentMethod.type = type;
      savedPaymentMethod.stripePaymentMethodId = stripePaymentMethodId;
      savedPaymentMethod.paypalPaymentMethodId = paypalPaymentMethodId;
      savedPaymentMethod.isDefault = isDefault;
      savedPaymentMethod.metadata = metadata;
      if (cardDetails) {
        savedPaymentMethod.card = cardDetails;
      }

      await repository.save(savedPaymentMethod);

      res.status(201).json({
        success: true,
        data: {
          id: savedPaymentMethod.id,
          type: savedPaymentMethod.type,
          isDefault: savedPaymentMethod.isDefault,
          last4: savedPaymentMethod.card?.last4,
          brand: savedPaymentMethod.card?.brand,
          expiryMonth: savedPaymentMethod.card?.expMonth,
          expiryYear: savedPaymentMethod.card?.expYear,
          displayName: savedPaymentMethod.getDisplayName(),
          metadata: savedPaymentMethod.metadata,
          createdAt: savedPaymentMethod.createdAt,
          updatedAt: savedPaymentMethod.updatedAt
        }
      });
    } catch (error) {
      console.error("Error saving payment method:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save payment method"
      });
    }
  }
);

// Delete a saved payment method
router.delete(
  "/payment-methods/:paymentMethodId",
  authenticateCustomer,
  async (req: Request, res: Response) => {
    try {
      const { paymentMethodId } = req.params;
      const repository = AppDataSource.getRepository(SavedPaymentMethod);

      const savedPaymentMethod = await repository.findOne({ 
        where: { id: paymentMethodId } 
      });
      
      if (!savedPaymentMethod) {
        return res.status(404).json({
          success: false,
          error: "Payment method not found"
        });
      }

      // Check if authenticated user owns this payment method
      // @ts-ignore - req.user is set by authenticateCustomer middleware
      if (req.user.customerId !== savedPaymentMethod.customerId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }

      // Detach from gateway if needed
      if (savedPaymentMethod.stripePaymentMethodId) {
        try {
          await stripeService.detachPaymentMethod(savedPaymentMethod.stripePaymentMethodId);
        } catch (error) {
          console.error("Error detaching Stripe payment method:", error);
          // Continue with deletion even if detachment fails
        }
      }

      await repository.remove(savedPaymentMethod);

      res.json({
        success: true,
        message: "Payment method deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete payment method"
      });
    }
  }
);

// Update default payment method
router.patch(
  "/payment-methods/:paymentMethodId/default",
  authenticateCustomer,
  async (req: Request, res: Response) => {
    try {
      const { paymentMethodId } = req.params;
      const repository = AppDataSource.getRepository(SavedPaymentMethod);

      const savedPaymentMethod = await repository.findOne({ 
        where: { id: paymentMethodId } 
      });
      
      if (!savedPaymentMethod) {
        return res.status(404).json({
          success: false,
          error: "Payment method not found"
        });
      }

      // Check if authenticated user owns this payment method
      // @ts-ignore - req.user is set by authenticateCustomer middleware
      if (req.user.customerId !== savedPaymentMethod.customerId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }

      // Unset other default payment methods for this customer
      await repository.update(
        { customerId: savedPaymentMethod.customerId, isDefault: true },
        { isDefault: false }
      );

      // Set this payment method as default
      savedPaymentMethod.isDefault = true;
      await repository.save(savedPaymentMethod);

      res.json({
        success: true,
        data: {
          id: savedPaymentMethod.id,
          type: savedPaymentMethod.type,
          isDefault: savedPaymentMethod.isDefault,
          last4: savedPaymentMethod.card?.last4,
          brand: savedPaymentMethod.card?.brand,
          expiryMonth: savedPaymentMethod.card?.expMonth,
          expiryYear: savedPaymentMethod.card?.expYear,
          displayName: savedPaymentMethod.getDisplayName(),
          metadata: savedPaymentMethod.metadata,
          createdAt: savedPaymentMethod.createdAt,
          updatedAt: savedPaymentMethod.updatedAt
        }
      });
    } catch (error) {
      console.error("Error updating default payment method:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update default payment method"
      });
    }
  }
);

// Admin route: Get all saved payment methods with filtering
router.get(
  "/admin/payment-methods",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const {
        customerId,
        type,
        isDefault,
        page = 1,
        limit = 10
      } = req.query;

      const repository = AppDataSource.getRepository(SavedPaymentMethod);
      const queryBuilder = repository.createQueryBuilder("pm");

      if (customerId) {
        queryBuilder.andWhere("pm.customerId = :customerId", { customerId });
      }

      if (type) {
        queryBuilder.andWhere("pm.type = :type", { type });
      }

      if (isDefault !== undefined) {
        queryBuilder.andWhere("pm.isDefault = :isDefault", { isDefault: isDefault === 'true' });
      }

      const totalCount = await queryBuilder.getCount();
      
      const paymentMethods = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy("pm.createdAt", "DESC")
        .getMany();

      res.json({
        success: true,
        data: paymentMethods.map(pm => ({
          id: pm.id,
          customerId: pm.customerId,
          type: pm.type,
          isDefault: pm.isDefault,
          last4: pm.card?.last4,
          brand: pm.card?.brand,
          expiryMonth: pm.card?.expMonth,
          expiryYear: pm.card?.expYear,
          displayName: pm.getDisplayName(),
          metadata: pm.metadata,
          createdAt: pm.createdAt,
          updatedAt: pm.updatedAt
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching payment methods (admin):", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch payment methods"
      });
    }
  }
);

export default router;
