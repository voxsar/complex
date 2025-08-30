import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional } from "class-validator";
import { v4 as uuidv4 } from "uuid";

export enum WebhookEventType {
  // Payment Intent Events
  PAYMENT_INTENT_SUCCEEDED = "payment_intent.succeeded",
  PAYMENT_INTENT_PAYMENT_FAILED = "payment_intent.payment_failed",
  PAYMENT_INTENT_CANCELED = "payment_intent.canceled",
  PAYMENT_INTENT_REQUIRES_ACTION = "payment_intent.requires_action",
  PAYMENT_INTENT_PROCESSING = "payment_intent.processing",
  PAYMENT_INTENT_AMOUNT_CAPTURABLE_UPDATED = "payment_intent.amount_capturable_updated",

  // Payment Method Events
  PAYMENT_METHOD_ATTACHED = "payment_method.attached",
  PAYMENT_METHOD_DETACHED = "payment_method.detached",
  PAYMENT_METHOD_UPDATED = "payment_method.updated",

  // Charge Events
  CHARGE_SUCCEEDED = "charge.succeeded",
  CHARGE_FAILED = "charge.failed",
  CHARGE_CAPTURED = "charge.captured",
  CHARGE_UPDATED = "charge.updated",
  CHARGE_REFUNDED = "charge.refunded",
  CHARGE_DISPUTE_CREATED = "charge.dispute.created",

  // Customer Events
  CUSTOMER_CREATED = "customer.created",
  CUSTOMER_UPDATED = "customer.updated",
  CUSTOMER_DELETED = "customer.deleted",
  CUSTOMER_SOURCE_CREATED = "customer.source.created",
  CUSTOMER_SOURCE_DELETED = "customer.source.deleted",

  // Subscription Events (for future use)
  INVOICE_PAYMENT_SUCCEEDED = "invoice.payment_succeeded",
  INVOICE_PAYMENT_FAILED = "invoice.payment_failed",
  SUBSCRIPTION_CREATED = "subscription.created",
  SUBSCRIPTION_UPDATED = "subscription.updated",
  SUBSCRIPTION_DELETED = "subscription.deleted",

  // Refund Events
  REFUND_CREATED = "refund.created",
  REFUND_UPDATED = "refund.updated",

  // Generic Events
  PING = "ping",
  TEST_EVENT = "test_event",
}

export enum WebhookStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  RETRY = "retry",
}

@Entity("webhook_events")
export class WebhookEvent {
  @PrimaryColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: WebhookEventType,
  })
  type: WebhookEventType;

  @Column({
    type: "enum",
    enum: WebhookStatus,
    default: WebhookStatus.PENDING,
  })
  status: WebhookStatus;

  @Column()
  @IsNotEmpty()
  source: string; // "stripe", "paypal", etc.

  @Column({ nullable: true })
  @IsOptional()
  sourceEventId?: string; // ID from the payment gateway

  @Column({ type: "json" })
  data: Record<string, any>; // The actual webhook payload

  @Column({ nullable: true })
  @IsOptional()
  signature?: string; // Webhook signature for verification

  @Column({ nullable: true })
  @IsOptional()
  relatedObjectId?: string; // payment_intent_id, customer_id, etc.

  @Column({ nullable: true })
  @IsOptional()
  relatedObjectType?: string; // "payment_intent", "customer", etc.

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastRetryAt?: Date;

  @Column({ nullable: true })
  processedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  errorMessage?: string;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  processingLogs?: Array<{
    timestamp: Date;
    level: string; // "info", "warning", "error"
    message: string;
    data?: any;
  }>;

  @Column({ default: false })
  livemode: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  // Helper methods
  isPending(): boolean {
    return this.status === WebhookStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.status === WebhookStatus.PROCESSING;
  }

  isSucceeded(): boolean {
    return this.status === WebhookStatus.SUCCEEDED;
  }

  isFailed(): boolean {
    return this.status === WebhookStatus.FAILED;
  }

  shouldRetry(): boolean {
    return this.status === WebhookStatus.RETRY && this.retryCount < 5;
  }

  markAsProcessing(): void {
    this.status = WebhookStatus.PROCESSING;
  }

  markAsSucceeded(): void {
    this.status = WebhookStatus.SUCCEEDED;
    this.processedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = WebhookStatus.FAILED;
    this.errorMessage = errorMessage;
    this.processedAt = new Date();
  }

  markForRetry(errorMessage: string): void {
    this.status = WebhookStatus.RETRY;
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    this.errorMessage = errorMessage;
  }

  addProcessingLog(level: string, message: string, data?: any): void {
    if (!this.processingLogs) {
      this.processingLogs = [];
    }
    
    this.processingLogs.push({
      timestamp: new Date(),
      level,
      message,
      data,
    });
  }
}
