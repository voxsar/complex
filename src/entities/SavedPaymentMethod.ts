import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional } from "class-validator";
import { v4 as uuidv4 } from "uuid";

export enum PaymentMethodType {
  CARD = "card",
  BANK_ACCOUNT = "bank_account",
  PAYPAL = "paypal",
  APPLE_PAY = "apple_pay",
  GOOGLE_PAY = "google_pay",
  SEPA_DEBIT = "sepa_debit",
  IDEAL = "ideal",
  SOFORT = "sofort",
  BANCONTACT = "bancontact",
  GIROPAY = "giropay",
  P24 = "p24",
  EPS = "eps",
  WECHAT_PAY = "wechat_pay",
  ALIPAY = "alipay",
}

@Entity("saved_payment_methods")
export class SavedPaymentMethod {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  customerId: string;

  @Column({
    type: "enum",
    enum: PaymentMethodType,
  })
  type: PaymentMethodType;

  @Column({ nullable: true })
  @IsOptional()
  stripePaymentMethodId?: string;

  @Column({ nullable: true })
  @IsOptional()
  paypalPaymentMethodId?: string;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: string; // credit, debit, prepaid, unknown
    country?: string;
    fingerprint?: string;
    cvcCheck?: string;
    networks?: {
      available: string[];
      preferred?: string;
    };
  };

  @Column({ type: "json", nullable: true })
  @IsOptional()
  bankAccount?: {
    accountHolderType: string;
    accountType: string;
    bankName: string;
    country: string;
    currency: string;
    fingerprint: string;
    last4: string;
    routingNumber: string;
    status: string;
  };

  @Column({ type: "json", nullable: true })
  @IsOptional()
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
      state?: string;
    };
  };

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @IsOptional()
  nickname?: string; // User-friendly name for the payment method

  @Column({ type: "json", nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  fingerprint?: string; // Unique identifier for deduplication

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastUsedAt?: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  // Helper methods
  getDisplayName(): string {
    if (this.nickname) {
      return this.nickname;
    }

    switch (this.type) {
      case PaymentMethodType.CARD:
        if (this.card) {
          return `${this.card.brand.toUpperCase()} •••• ${this.card.last4}`;
        }
        return "Card";

      case PaymentMethodType.BANK_ACCOUNT:
        if (this.bankAccount) {
          return `${this.bankAccount.bankName} •••• ${this.bankAccount.last4}`;
        }
        return "Bank Account";

      case PaymentMethodType.PAYPAL:
        return "PayPal";

      case PaymentMethodType.APPLE_PAY:
        return "Apple Pay";

      case PaymentMethodType.GOOGLE_PAY:
        return "Google Pay";

      default:
        return this.type.replace("_", " ").toUpperCase();
    }
  }

  isExpired(): boolean {
    if (!this.card) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return (
      this.card.expYear < currentYear ||
      (this.card.expYear === currentYear && this.card.expMonth < currentMonth)
    );
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }
}
