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
      const accessToken = await this.getAccessToken();

      const requestBody: any = {
        payer_id: params.email, // Using email as external identifier
        name: {
          given_name: params.firstName,
          surname: params.lastName,
        },
        email_address: params.email,
      };

      if (params.phone) {
        requestBody.phone = {
          phone_number: {
            national_number: params.phone,
          },
        };
      }

      const response = await axios.post<any>(
        `${this.baseUrl}/v1/vault/people`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`PayPal customer creation failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    headers: Record<string, string>,
    body: string | Record<string, any>,
    webhookId: string
  ): Promise<boolean> {
    try {
      if (!webhookId) {
        return false;
      }
      const authAlgo = headers["paypal-auth-algo"];
      const transmissionId = headers["paypal-transmission-id"];
      const certUrl = headers["paypal-cert-url"];
      const transmissionSig = headers["paypal-transmission-sig"];
      const transmissionTime = headers["paypal-transmission-time"];

      if (
        !authAlgo ||
        !transmissionId ||
        !certUrl ||
        !transmissionSig ||
        !transmissionTime
      ) {
        return false;
      }

      const accessToken = await this.getAccessToken();
      const payload = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event:
          typeof body === "string" ? JSON.parse(body) : body,
      };

      const response = await axios.post<{ verification_status: string }>(
        `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.verification_status === "SUCCESS";
    } catch (error) {
      logger.error({ err: error }, "PayPal webhook verification failed");
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
