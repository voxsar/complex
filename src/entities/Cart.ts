import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsNumber, Min, IsEmail } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { CartStatus } from "../enums/cart_status";
import { CartType } from "../enums/cart_type";

@Entity("carts")
export class Cart {
  @PrimaryColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;

  @Column({
    type: "enum",
    enum: CartType,
    default: CartType.DEFAULT,
  })
  type: CartType;

  @Column()
  @IsNotEmpty()
  currency: string; // ISO 4217 currency code

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  taxAmount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  shippingAmount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  discountAmount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  total: number;

  // Customer information
  @Column({ nullable: true })
  @IsOptional()
  customerId?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Billing address
  @Column({ nullable: true })
  billingAddress?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  };

  // Shipping address
  @Column({ nullable: true })
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  };

  // Sales channel and region scoping
  @Column({ nullable: true })
  @IsOptional()
  salesChannelId?: string;

  @Column({ nullable: true })
  @IsOptional()
  regionId?: string; // For geographic region/country

  @Column({ nullable: true })
  @IsOptional()
  taxRegionId?: string; // For tax calculations

  @Column({ nullable: true })
  @IsOptional()
  priceListId?: string;

  // Line items
  @Column({ default: [] })
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discountTotal: number;
    taxTotal: number;
    productTitle: string;
    variantTitle: string;
    productSku?: string;
    metadata?: Record<string, any>;
    productSnapshot?: {
      product: {
        id: string;
        title: string;
        description?: string;
        images: string[];
        handle?: string;
      };
      variant: {
        id: string;
        title: string;
        sku?: string;
        price: number;
        optionValues: Array<{
          option: string;
          value: string;
        }>;
        inventory?: {
          available: number;
          reserved: number;
        };
      };
    };
    createdAt: Date;
    updatedAt: Date;
  }>;

  // Applied promotions/discounts
  @Column({ default: [] })
  discounts: Array<{
    id: string;
    code?: string;
    promotionId: string;
    promotionTitle: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: number;
    discountAmount: number;
    isValid: boolean;
    appliedAt: Date;
  }>;

  // Shipping methods
  @Column({ default: [] })
  shippingMethods: Array<{
    id: string;
    shippingOptionId: string;
    name: string;
    price: number;
    data?: Record<string, any>;
    isSelected: boolean;
  }>;

  // Payment sessions (for payment providers)
  @Column({ default: [] })
  paymentSessions: Array<{
    id: string;
    providerId: string;
    providerSessionId: string;
    isSelected: boolean;
    isInitiated: boolean;
    status: 'pending' | 'authorized' | 'requires_more';
    data?: Record<string, any>;
  }>;

  // Tax breakdown
  @Column({ default: [] })
  taxBreakdown: Array<{
    name: string;
    rate: number;
    amount: number;
    source: 'default' | 'override' | 'parent';
  }>;

  // Cart metadata and notes
  @Column({ nullable: true })
  @IsOptional()
  customerNote?: string;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  // Session and expiry
  @Column({ nullable: true })
  @IsOptional()
  sessionId?: string;

  @Column({ nullable: true })
  @IsOptional()
  expiresAt?: Date;

  // Completion tracking
  @Column({ nullable: true })
  @IsOptional()
  completedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  orderId?: string; // Reference to created order

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
    if (!this.expiresAt) {
      // Default expiry: 30 days from creation
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Computed properties
  get itemsCount(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  get isGuest(): boolean {
    return !this.customerId;
  }

  get isEmpty(): boolean {
    return this.itemsCount === 0;
  }

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get hasShippingAddress(): boolean {
    return !!(this.shippingAddress?.address1 && this.shippingAddress?.city);
  }

  get hasBillingAddress(): boolean {
    return !!(this.billingAddress?.address1 && this.billingAddress?.city);
  }

  get hasSelectedShippingMethod(): boolean {
    return this.shippingMethods?.some(method => method.isSelected) || false;
  }

  get selectedShippingMethod() {
    return this.shippingMethods?.find(method => method.isSelected);
  }

  get hasSelectedPaymentMethod(): boolean {
    return this.paymentSessions?.some(session => session.isSelected) || false;
  }

  get selectedPaymentSession() {
    return this.paymentSessions?.find(session => session.isSelected);
  }

  get isReadyForCheckout(): boolean {
    return !this.isEmpty && 
           this.hasShippingAddress && 
           this.hasBillingAddress && 
           this.hasSelectedShippingMethod;
  }

  // Helper methods
  addLineItem(item: {
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    productTitle: string;
    variantTitle: string;
    productSku?: string;
    productSnapshot?: any;
    metadata?: Record<string, any>;
  }) {
    const existingItem = this.items.find(i => 
      i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
      existingItem.updatedAt = new Date();
    } else {
      const newItem = {
        id: uuidv4(),
        ...item,
        total: item.quantity * item.unitPrice,
        discountTotal: 0,
        taxTotal: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.items = [...(this.items || []), newItem];
    }

    this.recalculateTotals();
  }

  updateLineItem(itemId: string, updates: { quantity?: number; unitPrice?: number }) {
    this.items = this.items?.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates, updatedAt: new Date() };
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }) || [];

    this.recalculateTotals();
  }

  removeLineItem(itemId: string) {
    this.items = this.items?.filter(item => item.id !== itemId) || [];
    this.recalculateTotals();
  }

  applyDiscount(discount: {
    id: string;
    code?: string;
    promotionId: string;
    promotionTitle: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: number;
    discountAmount: number;
  }) {
    // Remove existing discount with same promotion ID
    this.discounts = this.discounts?.filter(d => d.promotionId !== discount.promotionId) || [];
    
    // Add new discount
    const newDiscount = {
      ...discount,
      isValid: true,
      appliedAt: new Date()
    };
    this.discounts = [...(this.discounts || []), newDiscount];
    
    this.recalculateTotals();
  }

  removeDiscount(discountId: string) {
    this.discounts = this.discounts?.filter(d => d.id !== discountId) || [];
    this.recalculateTotals();
  }

  setShippingMethod(shippingMethod: {
    id: string;
    shippingOptionId: string;
    name: string;
    price: number;
    data?: Record<string, any>;
  }) {
    // Deselect all shipping methods
    this.shippingMethods = this.shippingMethods?.map(method => ({
      ...method,
      isSelected: false
    })) || [];

    // Add or update selected shipping method
    const existingIndex = this.shippingMethods.findIndex(m => m.id === shippingMethod.id);
    if (existingIndex >= 0) {
      this.shippingMethods[existingIndex] = { ...shippingMethod, isSelected: true };
    } else {
      this.shippingMethods.push({ ...shippingMethod, isSelected: true });
    }

    this.shippingAmount = shippingMethod.price;
    this.recalculateTotals();
  }

  recalculateTotals() {
    // Calculate subtotal from items
    this.subtotal = this.items?.reduce((sum, item) => sum + item.total, 0) || 0;

    // Calculate total discount amount
    this.discountAmount = this.discounts?.reduce((sum, discount) => {
      if (discount.isValid) {
        return sum + discount.discountAmount;
      }
      return sum;
    }, 0) || 0;

    // Apply free shipping discount
    const hasFreeShipping = this.discounts?.some(d => 
      d.type === 'free_shipping' && d.isValid
    );
    if (hasFreeShipping) {
      this.shippingAmount = 0;
    }

    // Calculate total
    this.total = Math.max(0, this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount);
  }

  markAsCompleted(orderId: string) {
    this.status = CartStatus.COMPLETED;
    this.completedAt = new Date();
    this.orderId = orderId;
  }

  markAsAbandoned() {
    this.status = CartStatus.ABANDONED;
  }

  extendExpiry(days: number = 30) {
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
