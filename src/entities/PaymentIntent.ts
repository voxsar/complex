import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsNumber, Min, IsDecimal, IsOptional } from "class-validator";
import { v4 as uuidv4 } from "uuid";

export enum PaymentIntentStatus {
  REQUIRES_PAYMENT_METHOD = "requires_payment_method",
  REQUIRES_CONFIRMATION = "requires_confirmation",
  REQUIRES_ACTION = "requires_action",
  PROCESSING = "processing",
  REQUIRES_CAPTURE = "requires_capture",
  CANCELED = "canceled",
  SUCCEEDED = "succeeded",
}

export enum PaymentIntentCaptureMethod {
  AUTOMATIC = "automatic",
  MANUAL = "manual",
}

@Entity("payment_intents")
export class PaymentIntent {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  customerId: string;

  @Column({ nullable: true })
  @IsOptional()
  orderId?: string;

  @Column("decimal", { precision: 10, scale: 2 })
  @IsDecimal()
  @Min(0)
  amount: number;

  @Column({ length: 3 })
  @IsNotEmpty()
  currency: string; // ISO 4217 currency code

  @Column({
    type: "enum",
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
  })
  status: PaymentIntentStatus;

  @Column({
    type: "enum",
    enum: PaymentIntentCaptureMethod,
    default: PaymentIntentCaptureMethod.AUTOMATIC,
  })
  captureMethod: PaymentIntentCaptureMethod;

  @Column({ nullable: true })
  @IsOptional()
  paymentMethodId?: string; // Reference to saved payment method

  @Column({ nullable: true })
  @IsOptional()
  stripePaymentIntentId?: string; // Stripe payment intent ID

  @Column({ nullable: true })
  @IsOptional()
  paypalOrderId?: string; // PayPal order ID

  @Column({ nullable: true })
  @IsOptional()
  gateway?: string; // "stripe", "paypal", etc.

  @Column({ nullable: true })
  @IsOptional()
  clientSecret?: string; // For frontend integration

  @Column({ type: "json", nullable: true })
  @IsOptional()
  charges?: Array<{
    id: string;
    amount: number;
    captured: boolean;
    refunded: boolean;
    failureCode?: string;
    failureMessage?: string;
  }>;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  lastPaymentError?: {
    type: string;
    code?: string;
    message: string;
    declineCode?: string;
  };

  @Column({ type: "json", nullable: true })
  @IsOptional()
  nextAction?: {
    type: string;
    redirectToUrl?: {
      url: string;
      returnUrl: string;
    };
    useStripeSdk?: any;
  };

  @Column({ type: "json", nullable: true })
  @IsOptional()
  shippingAddress?: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };

  @Column({ type: "json", nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ nullable: true })
  @IsOptional()
  receiptEmail?: string;

  @Column({ nullable: true })
  @IsOptional()
  statementDescriptor?: string;

  @Column({ nullable: true })
  @IsOptional()
  applicationFeeAmount?: number;

  @Column({ default: false })
  livemode: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  // Helper methods
  isSucceeded(): boolean {
    return this.status === PaymentIntentStatus.SUCCEEDED;
  }

  isCanceled(): boolean {
    return this.status === PaymentIntentStatus.CANCELED;
  }

  requiresAction(): boolean {
    return this.status === PaymentIntentStatus.REQUIRES_ACTION;
  }

  requiresConfirmation(): boolean {
    return this.status === PaymentIntentStatus.REQUIRES_CONFIRMATION;
  }

  requiresCapture(): boolean {
    return this.status === PaymentIntentStatus.REQUIRES_CAPTURE;
  }

  canBeConfirmed(): boolean {
    return [
      PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
      PaymentIntentStatus.REQUIRES_CONFIRMATION,
    ].includes(this.status);
  }

  canBeCanceled(): boolean {
    return ![
      PaymentIntentStatus.SUCCEEDED,
      PaymentIntentStatus.CANCELED,
    ].includes(this.status);
  }
}
