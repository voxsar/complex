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
import { ExchangeStatus } from "../enums/exchange_status";

@Entity("order_exchanges")
export class OrderExchange {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  exchangeNumber: string;

  @Column({
    type: "enum",
    enum: ExchangeStatus,
    default: ExchangeStatus.REQUESTED,
  })
  status: ExchangeStatus;

  @Column()
  @IsNotEmpty()
  orderId: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  additionalAmount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  refundAmount: number;

  @Column()
  @IsNotEmpty()
  currency: string;

  @Column({ nullable: true })
  @IsOptional()
  customerNote?: string;

  @Column({ nullable: true })
  @IsOptional()
  adminNote?: string;

  @Column({ nullable: true })
  @IsOptional()
  reason?: string;

  @Column({ default: [] })
  returnItems: Array<{
    id: string;
    orderItemId: string;
    quantity: number;
    reason: string;
    condition?: string;
  }>;

  @Column({ default: [] })
  exchangeItems: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    total: number;
    productTitle: string;
    variantTitle: string;
  }>;

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
  processedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  shippedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  completedAt?: Date;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
    if (!this.exchangeNumber) {
      this.exchangeNumber = `EXC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }

  // Virtual properties
  get returnItemsCount(): number {
    return this.returnItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  get exchangeItemsCount(): number {
    return this.exchangeItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  get isCompleted(): boolean {
    return [ExchangeStatus.COMPLETED].includes(this.status);
  }

  get netAmount(): number {
    return this.additionalAmount - this.refundAmount;
  }
}
