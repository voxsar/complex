import Stripe from 'stripe';
import { PaymentIntent, PaymentIntentStatus, PaymentIntentCaptureMethod } from '../entities/PaymentIntent';
import { SavedPaymentMethod, PaymentMethodType } from '../entities/SavedPaymentMethod';
import { Refund, RefundStatus, RefundReason } from '../entities/Refund';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    });
  }

  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    paymentMethodId?: string;
    captureMethod?: PaymentIntentCaptureMethod;
    description?: string;
    metadata?: Record<string, any>;
    applicationFeeAmount?: number;
    receiptEmail?: string;
    shippingAddress?: any;
  }): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    clientSecret: string;
  }> {
    const stripeParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      capture_method: params.captureMethod === PaymentIntentCaptureMethod.MANUAL ? 'manual' : 'automatic',
      description: params.description,
      metadata: params.metadata || {},
      receipt_email: params.receiptEmail,
    };

    if (params.customerId) {
      stripeParams.customer = params.customerId;
    }

    if (params.paymentMethodId) {
      stripeParams.payment_method = params.paymentMethodId;
      stripeParams.confirmation_method = 'manual';
      stripeParams.confirm = true;
    }

    if (params.applicationFeeAmount) {
      stripeParams.application_fee_amount = Math.round(params.applicationFeeAmount * 100);
    }

    if (params.shippingAddress) {
      stripeParams.shipping = {
        name: params.shippingAddress.name,
        address: {
          line1: params.shippingAddress.address1,
          line2: params.shippingAddress.address2,
          city: params.shippingAddress.city,
          state: params.shippingAddress.state,
          postal_code: params.shippingAddress.postalCode,
          country: params.shippingAddress.country,
        },
        phone: params.shippingAddress.phone,
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(stripeParams);

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      throw new Error(`Stripe payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
    returnUrl?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};

      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      if (returnUrl) {
        params.return_url = returnUrl;
      }

      return await this.stripe.paymentIntents.confirm(paymentIntentId, params);
    } catch (error) {
      throw new Error(`Stripe payment intent confirmation failed: ${error.message}`);
    }
  }

  /**
   * Capture a payment intent
   */
  async capturePaymentIntent(
    paymentIntentId: string,
    amountToCapture?: number
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentCaptureParams = {};

      if (amountToCapture) {
        params.amount_to_capture = Math.round(amountToCapture * 100);
      }

      return await this.stripe.paymentIntents.capture(paymentIntentId, params);
    } catch (error) {
      throw new Error(`Stripe payment intent capture failed: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      throw new Error(`Stripe payment intent cancellation failed: ${error.message}`);
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(params: {
    email?: string;
    name?: string;
    phone?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        description: params.description,
        metadata: params.metadata || {},
      });
    } catch (error) {
      throw new Error(`Stripe customer creation failed: ${error.message}`);
    }
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(params: {
    type: 'card';
    card?: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    billing_details?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
  }): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.create(params);
    } catch (error) {
      throw new Error(`Stripe payment method creation failed: ${error.message}`);
    }
  }

  /**
   * Attach a payment method to a customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      throw new Error(`Stripe payment method attachment failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment method from Stripe
   */
  async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      logger.error({ err: error }, 'Error retrieving Stripe payment method');
      throw error;
    }
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      logger.error({ err: error }, 'Error detaching Stripe payment method');
      throw error;
    }
  }

  /**
   * List customer payment methods
   */
  async listCustomerPaymentMethods(
    customerId: string,
    type?: 'card' | 'sepa_debit' | 'us_bank_account'
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type || 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      throw new Error(`Stripe payment methods listing failed: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    paymentIntentId?: string;
    chargeId?: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, any>;
  }): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        reason: params.reason,
        metadata: params.metadata || {},
      };

      if (params.paymentIntentId) {
        refundParams.payment_intent = params.paymentIntentId;
      } else if (params.chargeId) {
        refundParams.charge = params.chargeId;
      } else {
        throw new Error('Either paymentIntentId or chargeId must be provided');
      }

      if (params.amount) {
        refundParams.amount = Math.round(params.amount * 100);
      }

      return await this.stripe.refunds.create(refundParams);
    } catch (error) {
      throw new Error(`Stripe refund creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      throw new Error(`Stripe payment intent retrieval failed: ${error.message}`);
    }
  }

  /**
   * Construct webhook event from request
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (error) {
      throw new Error(`Stripe webhook event construction failed: ${error.message}`);
    }
  }

  /**
   * Convert Stripe status to our internal status
   */
  convertPaymentIntentStatus(stripeStatus: string): PaymentIntentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
        return PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
      case 'requires_confirmation':
        return PaymentIntentStatus.REQUIRES_CONFIRMATION;
      case 'requires_action':
        return PaymentIntentStatus.REQUIRES_ACTION;
      case 'processing':
        return PaymentIntentStatus.PROCESSING;
      case 'requires_capture':
        return PaymentIntentStatus.REQUIRES_CAPTURE;
      case 'canceled':
        return PaymentIntentStatus.CANCELED;
      case 'succeeded':
        return PaymentIntentStatus.SUCCEEDED;
      default:
        return PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
    }
  }

  /**
   * Convert Stripe payment method to our internal format
   */
  convertPaymentMethod(stripePaymentMethod: Stripe.PaymentMethod): {
    type: PaymentMethodType;
    card?: any;
    billingDetails?: any;
  } {
    const result: any = {
      type: this.convertPaymentMethodType(stripePaymentMethod.type),
      billingDetails: stripePaymentMethod.billing_details,
    };

    if (stripePaymentMethod.card) {
      result.card = {
        brand: stripePaymentMethod.card.brand,
        last4: stripePaymentMethod.card.last4,
        expMonth: stripePaymentMethod.card.exp_month,
        expYear: stripePaymentMethod.card.exp_year,
        funding: stripePaymentMethod.card.funding,
        country: stripePaymentMethod.card.country,
        fingerprint: stripePaymentMethod.card.fingerprint,
        cvcCheck: stripePaymentMethod.card.checks?.cvc_check,
        networks: stripePaymentMethod.card.networks,
      };
    }

    return result;
  }

  private convertPaymentMethodType(stripeType: string): PaymentMethodType {
    switch (stripeType) {
      case 'card':
        return PaymentMethodType.CARD;
      case 'sepa_debit':
        return PaymentMethodType.SEPA_DEBIT;
      case 'ideal':
        return PaymentMethodType.IDEAL;
      case 'sofort':
        return PaymentMethodType.SOFORT;
      case 'bancontact':
        return PaymentMethodType.BANCONTACT;
      case 'giropay':
        return PaymentMethodType.GIROPAY;
      case 'p24':
        return PaymentMethodType.P24;
      case 'eps':
        return PaymentMethodType.EPS;
      case 'wechat_pay':
        return PaymentMethodType.WECHAT_PAY;
      case 'alipay':
        return PaymentMethodType.ALIPAY;
      default:
        return PaymentMethodType.CARD;
    }
  }
}
