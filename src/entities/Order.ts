import {
  Entity,
  ObjectIdColumn,
  ObjectId,
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
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
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
    metadata?: Record<string, any>;
    createdAt: Date;
  }>;

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
}
