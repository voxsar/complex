import axios from 'axios';
import { PaymentIntent, PaymentIntentStatus } from '../entities/PaymentIntent';
import { Refund, RefundStatus } from '../entities/Refund';

export class PayPalService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables are required');
    }

    this.baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get access token for PayPal API
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = (response.data as any).access_token;
      this.tokenExpiry = new Date(Date.now() + ((response.data as any).expires_in - 60) * 1000);

      return this.accessToken;
    } catch (error) {
      throw new Error(`PayPal token generation failed: ${error.message}`);
    }
  }

  /**
   * Create a PayPal order (equivalent to payment intent)
   */
  async createOrder(params: {
    amount: number;
    currency: string;
    description?: string;
    customerId?: string;
    returnUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const orderRequest = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: params.amount.toFixed(2),
            },
            description: params.description,
            custom_id: params.customerId,
          },
        ],
        application_context: {
          return_url: params.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: params.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
          brand_name: process.env.APP_NAME || 'E-commerce Platform',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        orderRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal order creation failed: ${error.message}`);
    }
  }

  /**
   * Capture a PayPal order
   */
  async captureOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal order capture failed: ${error.message}`);
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal order retrieval failed: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    captureId: string;
    amount?: number;
    currency?: string;
    invoiceId?: string;
    noteToPayer?: string;
  }): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const refundRequest: any = {
        note_to_payer: params.noteToPayer || 'Refund processed',
        invoice_id: params.invoiceId,
      };

      if (params.amount && params.currency) {
        refundRequest.amount = {
          value: params.amount.toFixed(2),
          currency_code: params.currency.toUpperCase(),
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${params.captureId}/refund`,
        refundRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal refund creation failed: ${error.message}`);
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/v2/payments/refunds/${refundId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal refund retrieval failed: ${error.message}`);
    }
  }

  /**
   * Create a customer (vault)
   */
  async createCustomer(params: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<any> {
    try {
      // PayPal doesn't have a direct customer creation like Stripe
      // This would typically be handled through the vault API for saving payment methods
      // For now, we'll return a placeholder implementation
      return {
        id: `paypal_customer_${Date.now()}`,
        email: params.email,
        name: {
          given_name: params.firstName,
          surname: params.lastName,
        },
        phone: params.phone,
      };
    } catch (error) {
      throw new Error(`PayPal customer creation failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    headers: Record<string, string>,
    body: string,
    webhookId: string
  ): Promise<boolean> {
    try {
      // PayPal webhook verification implementation
      // This would use PayPal's webhook verification API
      const authAlgo = headers['paypal-auth-algo'];
      const transmission = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const timestamp = headers['paypal-transmission-time'];
      const signature = headers['paypal-transmission-sig'];

      if (!authAlgo || !transmission || !certId || !timestamp || !signature) {
        return false;
      }

      // In a real implementation, you would verify the signature using PayPal's SDK
      // For now, we'll assume the webhook is valid if all required headers are present
      return true;
    } catch (error) {
      console.error('PayPal webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Convert PayPal status to our internal status
   */
  convertOrderStatus(paypalStatus: string): PaymentIntentStatus {
    switch (paypalStatus) {
      case 'CREATED':
        return PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
      case 'SAVED':
        return PaymentIntentStatus.REQUIRES_CONFIRMATION;
      case 'APPROVED':
        return PaymentIntentStatus.REQUIRES_CAPTURE;
      case 'VOIDED':
        return PaymentIntentStatus.CANCELED;
      case 'COMPLETED':
        return PaymentIntentStatus.SUCCEEDED;
      case 'PAYER_ACTION_REQUIRED':
        return PaymentIntentStatus.REQUIRES_ACTION;
      default:
        return PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
    }
  }

  /**
   * Convert PayPal refund status to our internal status
   */
  convertRefundStatus(paypalStatus: string): RefundStatus {
    switch (paypalStatus) {
      case 'COMPLETED':
        return RefundStatus.SUCCEEDED;
      case 'PENDING':
        return RefundStatus.PROCESSING;
      case 'FAILED':
        return RefundStatus.FAILED;
      case 'CANCELLED':
        return RefundStatus.CANCELED;
      default:
        return RefundStatus.PENDING;
    }
  }
}
