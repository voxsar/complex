import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsNumber, Min } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { OrderStatus } from "../enums/order_status"; // Assuming OrderStatus is defined in a separate file
import { OrderFulfillmentStatus } from "../enums/order_fulfillment_status"; // Assuming
import { OrderFinancialStatus } from "../enums/order_financial_status"; // Assuming OrderFinancialStatus is defined in a separate file

@Entity("orders")
export class Order {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: "enum",
    enum: OrderFulfillmentStatus,
    default: OrderFulfillmentStatus.UNFULFILLED,
  })
  fulfillmentStatus: OrderFulfillmentStatus;

  @Column({
    type: "enum",
    enum: OrderFinancialStatus,
    default: OrderFinancialStatus.PENDING,
  })
  financialStatus: OrderFinancialStatus;

  @Column("decimal", { precision: 10, scale: 2 })
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

  @Column("decimal", { precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  total: number;

  @Column()
  @IsNotEmpty()
  currency: string;

  @Column()
  billingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };

  @Column({ nullable: true })
  shippingAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };

  @Column({ nullable: true })
  @IsOptional()
  note?: string;

  @Column({ nullable: true })
  @IsOptional()
  adminNote?: string;

  @Column({ default: [] })
  tags: string[];

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  shippedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  deliveredAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  cancelledAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  cancellationReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Foreign key references (stored as strings for MongoDB)
  @Column({ nullable: true })
  customerId?: string;

  @Column({ nullable: true })
  salesChannelId?: string;

  @Column({ nullable: true })
  priceListId?: string;

  // Embedded items and payments arrays
  @Column({ default: [] })
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    productTitle: string;
    variantTitle: string;
    productSku?: string;
    variantId?: string;
    productSnapshot?: {
      product: {
        id: string;
        title: string;
        images: string[];
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
      };
    };
  }>;

  @Column({ default: [] })
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    reference?: string;
    gatewayTransactionId?: string;
    gatewayResponse?: Record<string, any>;
    failureReason?: string;
    processedAt?: Date;
    refundedAmount?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
  }>;

  @Column({ default: [] })
  fulfillments: Array<{
    id: string;
    status: string;
    trackingCompany?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    items: Array<{
      orderItemId: string;
      quantity: number;
    }>;
    metadata?: Record<string, any>;
    createdAt: Date;
  }>;

  @Column({ default: [] })
  returnIds: string[];

  @Column({ default: [] })
  claimIds: string[];

  @Column({ default: [] })
  exchangeIds: string[];

  @Column({ nullable: true })
  @IsOptional()
  taxRegionId?: string; // ID of the tax region used for this order

  @Column({ default: [] })
  taxBreakdown: Array<{
    name: string;
    rate: number;
    amount: number;
    source: 'default' | 'override' | 'parent';
  }>; // Detailed tax breakdown

  @Column({ nullable: true })
  @IsOptional()
  taxExempt?: boolean; // Whether this order is tax exempt

  @Column({ nullable: true })
  @IsOptional()
  taxExemptReason?: string; // Reason for tax exemption

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // Virtual properties
  get itemsCount(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  get isGuest(): boolean {
    return !this.customerId;
  }

  get totalPaid(): number {
    return this.payments?.reduce((sum, payment) => {
      return payment.status === 'paid' ? sum + payment.amount : sum;
    }, 0) || 0;
  }

  get totalRefunded(): number {
    return this.payments?.reduce((sum, payment) => {
      return sum + (payment.refundedAmount || 0);
    }, 0) || 0;
  }

  get remainingBalance(): number {
    return this.total - this.totalPaid;
  }

  get isPaid(): boolean {
    return this.remainingBalance <= 0;
  }

  get hasReturns(): boolean {
    return this.returnIds.length > 0;
  }

  get hasClaims(): boolean {
    return this.claimIds.length > 0;
  }

  get hasExchanges(): boolean {
    return this.exchangeIds.length > 0;
  }

  get isFulfilled(): boolean {
    const totalFulfilledQuantity = this.fulfillments?.reduce((sum, fulfillment) => {
      if (fulfillment.status === 'fulfilled') {
        return sum + fulfillment.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }
      return sum;
    }, 0) || 0;
    
    return totalFulfilledQuantity >= this.itemsCount;
  }

  get outstandingAmount(): number {
    return this.remainingBalance;
  }

  get hasOutstandingAmount(): boolean {
    return this.outstandingAmount > 0;
  }

  get canCapture(): boolean {
    return this.payments?.some(p => p.status === 'authorized') || false;
  }

  get canRefund(): boolean {
    return this.payments?.some(p => p.status === 'captured' || p.status === 'paid') || false;
  }

  // Helper methods
  addPayment(payment: Omit<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    reference?: string;
    gatewayTransactionId?: string;
    gatewayResponse?: Record<string, any>;
    failureReason?: string;
    processedAt?: Date;
    refundedAmount?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
  }, 'id' | 'createdAt'>) {
    const newPayment = {
      ...payment,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.payments = [...(this.payments || []), newPayment];
    return newPayment;
  }

  addFulfillment(fulfillment: Omit<{
    id: string;
    status: string;
    trackingCompany?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    items: Array<{
      orderItemId: string;
      quantity: number;
    }>;
    metadata?: Record<string, any>;
    createdAt: Date;
  }, 'id' | 'createdAt'>) {
    const newFulfillment = {
      ...fulfillment,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.fulfillments = [...(this.fulfillments || []), newFulfillment];
    return newFulfillment;
  }

  updatePaymentStatus(paymentId: string, status: string, metadata?: Record<string, any>) {
    this.payments = this.payments?.map(payment => 
      payment.id === paymentId 
        ? { ...payment, status, ...(metadata && { metadata: { ...payment.metadata, ...metadata } }) }
        : payment
    ) || [];
  }

  addRefund(paymentId: string, amount: number) {
    this.payments = this.payments?.map(payment => 
      payment.id === paymentId 
        ? { ...payment, refundedAmount: (payment.refundedAmount || 0) + amount }
        : payment
    ) || [];
  }
}
