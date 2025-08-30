import { AppDataSource } from "../data-source";
import { Cart } from "../entities/Cart";
import { Order } from "../entities/Order";
import { CartService } from "./cartService";
import { OrderStatus } from "../enums/order_status";
import { OrderFulfillmentStatus } from "../enums/order_fulfillment_status";
import { OrderFinancialStatus } from "../enums/order_financial_status";
import { Repository } from "typeorm";
import { PaymentIntent, PaymentIntentStatus } from "../entities/PaymentIntent";
import { Payment } from "../entities/Payment";
import { PaymentStatus } from "../enums/payment_status";
import { PaymentMethod } from "../enums/payment_method";
import { StripeService } from "../services/StripeService";

export class CartToOrderService {
  private cartRepository: Repository<Cart>;
  private orderRepository: Repository<Order>;
  private cartService: CartService;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.orderRepository = AppDataSource.getRepository(Order);
    this.cartService = new CartService();
  }

  async convertCartToOrder(cartId: string, additionalData?: {
    orderNumber?: string;
    note?: string;
    adminNote?: string;
    tags?: string[];
  }): Promise<Order> {
    const cart = await this.cartService.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    if (cart.isEmpty) {
      throw new Error("Cannot create order from empty cart");
    }

    if (!cart.hasShippingAddress) {
      throw new Error("Shipping address is required to create order");
    }

    if (!cart.hasBillingAddress) {
      throw new Error("Billing address is required to create order");
    }

    // Generate order number if not provided
    const orderNumber = additionalData?.orderNumber || await this.generateOrderNumber();

    // Create order from cart data
    const order = new Order();
    
    // Basic order information
    order.orderNumber = orderNumber;
    order.status = OrderStatus.PENDING;
    order.fulfillmentStatus = OrderFulfillmentStatus.UNFULFILLED;
    order.financialStatus = OrderFinancialStatus.PENDING;

    // Financial totals
    order.subtotal = cart.subtotal;
    order.taxAmount = cart.taxAmount;
    order.shippingAmount = cart.shippingAmount;
    order.discountAmount = cart.discountAmount;
    order.total = cart.total;
    order.currency = cart.currency;

    // Customer and channel information
    order.customerId = cart.customerId;
    order.salesChannelId = cart.salesChannelId;
    order.priceListId = cart.priceListId;

    // Addresses
    order.billingAddress = {
      firstName: cart.billingAddress?.firstName || "",
      lastName: cart.billingAddress?.lastName || "",
      company: cart.billingAddress?.company,
      address1: cart.billingAddress?.address1 || "",
      address2: cart.billingAddress?.address2,
      city: cart.billingAddress?.city || "",
      province: cart.billingAddress?.province || "",
      country: cart.billingAddress?.country || "",
      zip: cart.billingAddress?.zip || "",
      phone: cart.billingAddress?.phone
    };

    order.shippingAddress = {
      firstName: cart.shippingAddress?.firstName || "",
      lastName: cart.shippingAddress?.lastName || "",
      company: cart.shippingAddress?.company,
      address1: cart.shippingAddress?.address1 || "",
      address2: cart.shippingAddress?.address2,
      city: cart.shippingAddress?.city || "",
      province: cart.shippingAddress?.province || "",
      country: cart.shippingAddress?.country || "",
      zip: cart.shippingAddress?.zip || "",
      phone: cart.shippingAddress?.phone
    };

    // Convert cart items to order items
    order.items = cart.items.map(cartItem => ({
      id: cartItem.id,
      quantity: cartItem.quantity,
      price: cartItem.unitPrice,
      total: cartItem.total,
      productTitle: cartItem.productTitle,
      variantTitle: cartItem.variantTitle,
      productSku: cartItem.productSku,
      variantId: cartItem.variantId,
      productSnapshot: cartItem.productSnapshot
    }));

    // Tax information
    order.taxRegionId = cart.taxRegionId;
    order.taxBreakdown = cart.taxBreakdown;

    // Additional data
    order.note = cart.customerNote || additionalData?.note;
    order.adminNote = additionalData?.adminNote;
    order.tags = additionalData?.tags || [];
    order.metadata = cart.metadata;

    // Initialize empty arrays for order management
    order.payments = [];
    order.fulfillments = [];
    order.returnIds = [];
    order.claimIds = [];
    order.exchangeIds = [];

    // Save the order
    const savedOrder = await this.orderRepository.save(order);

    // Mark cart as completed
    await this.cartService.completeCart(cartId, savedOrder.id);

    return savedOrder;
  }

  async createOrderFromCart(cartId: string, orderData?: {
    orderNumber?: string;
    note?: string;
    adminNote?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<Order> {
    return await this.convertCartToOrder(cartId, orderData);
  }

  private async generateOrderNumber(): Promise<string> {
    const prefix = "ORD";
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.random().toString(36).substr(2, 4).toUpperCase(); // 4 random chars
    
    const orderNumber = `${prefix}-${timestamp}-${random}`;
    
    // Check if order number already exists
    const existingOrder = await this.orderRepository.findOne({
      where: { orderNumber }
    });
    
    if (existingOrder) {
      // Recursively generate a new number if collision occurs
      return await this.generateOrderNumber();
    }
    
    return orderNumber;
  }

  async validateCartForCheckout(cartId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const cart = await this.cartService.getCart(cartId);
    if (!cart) {
      return {
        isValid: false,
        errors: ["Cart not found"],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Required validations
    if (cart.isEmpty) {
      errors.push("Cart is empty");
    }

    if (!cart.hasShippingAddress) {
      errors.push("Shipping address is required");
    }

    if (!cart.hasBillingAddress) {
      errors.push("Billing address is required");
    }

    if (!cart.currency) {
      errors.push("Currency is required");
    }

    // Optional validations (warnings)
    if (!cart.hasSelectedShippingMethod) {
      warnings.push("No shipping method selected");
    }

    if (cart.isExpired) {
      warnings.push("Cart has expired");
    }

    if (!cart.email && !cart.customerId) {
      warnings.push("No customer email or customer ID provided");
    }

    // Inventory validations (simplified)
    for (const item of cart.items) {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for item: ${item.productTitle}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async checkout(params: {
    cartId: string;
    customer?: {
      email?: string;
      billingAddress?: any;
      shippingAddress?: any;
    };
    shippingMethod?: {
      shippingOptionId: string;
      name: string;
      price: number;
      data?: Record<string, any>;
    };
    payment: {
      paymentIntentId: string;
      paymentMethodId?: string;
    };
  }): Promise<{ order?: Order; errors?: string[] }> {
    return await AppDataSource.transaction(async (manager) => {
      const cartRepository = manager.getRepository(Cart);
      const orderRepository = manager.getRepository(Order);
      const paymentIntentRepository = manager.getRepository(PaymentIntent);
      const paymentRepository = manager.getRepository(Payment);

      const cart = await cartRepository.findOne({ where: { id: params.cartId } });
      if (!cart) {
        return { errors: ["Cart not found"] };
      }

      if (params.customer) {
        if (params.customer.email) cart.email = params.customer.email;
        if (params.customer.billingAddress) cart.billingAddress = params.customer.billingAddress;
        if (params.customer.shippingAddress) {
          cart.shippingAddress = params.customer.shippingAddress;
          if (params.customer.shippingAddress.country) {
            const taxRegion = await (this.cartService as any).findTaxRegion(
              params.customer.shippingAddress.country,
              params.customer.shippingAddress.province
            );
            if (taxRegion) {
              cart.taxRegionId = taxRegion.id;
              await (this.cartService as any).calculateTaxes(cart);
            }
          }
        }
      }

      if (params.shippingMethod) {
        cart.setShippingMethod({
          id: `shipping_${Date.now()}`,
          shippingOptionId: params.shippingMethod.shippingOptionId,
          name: params.shippingMethod.name,
          price: params.shippingMethod.price,
          data: params.shippingMethod.data,
        });
      }

      await cartRepository.save(cart);

      const validation = await this.validateCartForCheckout(cart.id);
      if (!validation.isValid) {
        return { errors: validation.errors };
      }

      const paymentIntent = await paymentIntentRepository.findOne({
        where: { id: params.payment.paymentIntentId },
      });
      if (!paymentIntent) {
        return { errors: ["Payment intent not found"] };
      }

      const stripe = new StripeService();
      const stripeIntent = await stripe.confirmPaymentIntent(
        paymentIntent.stripePaymentIntentId || paymentIntent.id,
        params.payment.paymentMethodId
      );
      paymentIntent.status = stripe.convertPaymentIntentStatus(stripeIntent.status);
      await paymentIntentRepository.save(paymentIntent);

      if (paymentIntent.status !== PaymentIntentStatus.SUCCEEDED) {
        return { errors: ["Payment not confirmed"] };
      }

      const order = new Order();
      order.orderNumber = await this.generateOrderNumber();
      order.status = OrderStatus.PENDING;
      order.fulfillmentStatus = OrderFulfillmentStatus.UNFULFILLED;
      order.financialStatus = OrderFinancialStatus.PENDING;
      order.subtotal = cart.subtotal;
      order.taxAmount = cart.taxAmount;
      order.shippingAmount = cart.shippingAmount;
      order.discountAmount = cart.discountAmount;
      order.total = cart.total;
      order.currency = cart.currency;
      order.customerId = cart.customerId;
      order.salesChannelId = cart.salesChannelId;
      order.priceListId = cart.priceListId;
      order.billingAddress = cart.billingAddress as any;
      order.shippingAddress = cart.shippingAddress as any;
      order.items = cart.items.map((cartItem) => ({
        id: cartItem.id,
        quantity: cartItem.quantity,
        price: cartItem.unitPrice,
        total: cartItem.total,
        productTitle: cartItem.productTitle,
        variantTitle: cartItem.variantTitle,
        productSku: cartItem.productSku,
        variantId: cartItem.variantId,
        productSnapshot: cartItem.productSnapshot,
      }));
      order.taxRegionId = cart.taxRegionId;
      order.taxBreakdown = cart.taxBreakdown;
      order.note = cart.customerNote;
      order.metadata = cart.metadata;
      order.tags = [];
      order.payments = [];
      order.fulfillments = [];
      order.returnIds = [];
      order.claimIds = [];
      order.exchangeIds = [];

      const savedOrder = await orderRepository.save(order);

      cart.markAsCompleted(savedOrder.id);
      await cartRepository.save(cart);

      const paymentRecord = paymentRepository.create({
        orderId: savedOrder.id,
        amount: cart.total,
        currency: cart.currency,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.STRIPE,
        transactionId: paymentIntent.id,
        gatewayTransactionId: paymentIntent.stripePaymentIntentId,
        paymentGateway: "stripe",
        customerId: cart.customerId,
        billingAddress: cart.billingAddress,
      });
      await paymentRepository.save(paymentRecord);
      savedOrder.payments = [paymentRecord];
      await orderRepository.save(savedOrder);

      return { order: savedOrder };
    });
  }

  async getCheckoutSummary(cartId: string): Promise<{
    cart: Cart;
    validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
    totals: {
      itemsCount: number;
      subtotal: number;
      taxAmount: number;
      shippingAmount: number;
      discountAmount: number;
      total: number;
      currency: string;
    };
    readyForCheckout: boolean;
  }> {
    const cart = await this.cartService.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const validation = await this.validateCartForCheckout(cartId);

    return {
      cart,
      validation,
      totals: {
        itemsCount: cart.itemsCount,
        subtotal: cart.subtotal,
        taxAmount: cart.taxAmount,
        shippingAmount: cart.shippingAmount,
        discountAmount: cart.discountAmount,
        total: cart.total,
        currency: cart.currency
      },
      readyForCheckout: cart.isReadyForCheckout && validation.isValid
    };
  }
}
