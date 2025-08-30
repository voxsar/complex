import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsNumber, Min, IsDecimal, IsOptional } from "class-validator";
import { v4 as uuidv4 } from "uuid";

export enum RefundStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELED = "canceled",
}

export enum RefundReason {
  DUPLICATE = "duplicate",
  FRAUDULENT = "fraudulent",
  REQUESTED_BY_CUSTOMER = "requested_by_customer",
  EXPIRED_UNCAPTURED_CHARGE = "expired_uncaptured_charge",
  OTHER = "other",
}

@Entity("refunds")
export class Refund {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  paymentId: string; // Reference to original payment

  @Column({ nullable: true })
  @IsOptional()
  paymentIntentId?: string; // Reference to payment intent

  @Column({ nullable: true })
  @IsOptional()
  orderId?: string;

  @Column("decimal", { precision: 10, scale: 2 })
  @IsDecimal()
  @Min(0)
  amount: number;

  @Column({ length: 3 })
  @IsNotEmpty()
  currency: string;

  @Column({
    type: "enum",
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status: RefundStatus;

  @Column({
    type: "enum",
    enum: RefundReason,
    default: RefundReason.REQUESTED_BY_CUSTOMER,
  })
  reason: RefundReason;

  @Column({ nullable: true })
  @IsOptional()
  stripeRefundId?: string;

  @Column({ nullable: true })
  @IsOptional()
  paypalRefundId?: string;

  @Column({ nullable: true })
  @IsOptional()
  gateway?: string; // "stripe", "paypal", etc.

  @Column({ nullable: true })
  @IsOptional()
  gatewayTransactionId?: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  failureReason?: string;

  @Column({ nullable: true })
  @IsOptional()
  receiptNumber?: string;

  @Column({ nullable: true })
  @IsOptional()
  initiatedBy?: string; // User ID who initiated the refund

  @Column({ default: false })
  isAutomatic: boolean; // Whether this was an automatic refund

  @Column({ type: "json", nullable: true })
  @IsOptional()
  gatewayResponse?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  processedAt?: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  // Helper methods
  isSucceeded(): boolean {
    return this.status === RefundStatus.SUCCEEDED;
  }

  isFailed(): boolean {
    return this.status === RefundStatus.FAILED;
  }

  isPending(): boolean {
    return this.status === RefundStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.status === RefundStatus.PROCESSING;
  }

  canBeCanceled(): boolean {
    return [RefundStatus.PENDING].includes(this.status);
  }
}
