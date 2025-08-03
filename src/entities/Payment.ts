import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsNumber, Min, IsDecimal } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { PaymentStatus } from "../enums/payment_status"; // Assuming PaymentStatus is defined in a separate file
import { PaymentMethod } from "../enums/payment_method"; // Assuming PaymentMethod is defined in a separate file

@Entity("payments")
export class Payment {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  orderId: string;

  @Column("decimal", { precision: 10, scale: 2 })
  @IsDecimal()
  @Min(0)
  amount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsDecimal()
  @Min(0)
  refundedAmount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsDecimal()
  @Min(0)
  authorizedAmount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsDecimal()
  @Min(0)
  capturedAmount: number;

  @Column({ length: 3 })
  @IsNotEmpty()
  currency: string; // ISO 4217 currency code

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: "enum",
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ nullable: true })
  gatewayTransactionId?: string;

  @Column({ nullable: true })
  paymentGateway?: string; // e.g., "stripe", "paypal", etc.

  @Column({ nullable: true })
  customerId?: string;

  @Column({ nullable: true })
  billingAddress?: {
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
  cardInfo?: {
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };

  @Column({ nullable: true })
  failureReason?: string;

  @Column({ nullable: true })
  processingFee?: number;

  @Column({ nullable: true })
  gatewayResponse?: Record<string, any>;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED || this.status === PaymentStatus.CAPTURED;
  }

  get isAuthorized(): boolean {
    return this.status === PaymentStatus.AUTHORIZED || this.status === PaymentStatus.PARTIALLY_AUTHORIZED;
  }

  get isCaptured(): boolean {
    return this.status === PaymentStatus.CAPTURED || this.status === PaymentStatus.PARTIALLY_CAPTURED;
  }

  get availableToCapture(): number {
    return this.authorizedAmount - this.capturedAmount;
  }

  get refundableAmount(): number {
    return this.capturedAmount - this.refundedAmount;
  }

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
