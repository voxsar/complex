import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { CustomerStatus } from "../enums/customer_status"; // Assuming CustomerStatus is defined in a separate file

@Entity("customers")
export class Customer {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  firstName: string;

  @Column()
  @IsNotEmpty()
  lastName: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @IsOptional()
  phone?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({
    type: "enum",
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @Column({ nullable: true })
  @IsOptional()
  dateOfBirth?: Date;

  @Column({ default: false })
  acceptsMarketing: boolean;

  @Column({ default: [] })
  addresses: Array<{
    id: string;
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
    isDefault: boolean;
  }>;

  @Column({ nullable: true })
  @IsOptional()
  taxExempt?: boolean;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  note?: string;

  @Column({ nullable: true })
  @IsOptional()
  avatar?: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column("int", { default: 0 })
  ordersCount: number;

  @Column({ nullable: true })
  @IsOptional()
  lastOrderAt?: Date;

  // Authentication & Verification fields
  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpires?: Date;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  // Loyalty Program fields
  @Column("int", { default: 0 })
  loyaltyPoints: number;

  @Column({ nullable: true })
  loyaltyTier?: string; // Bronze, Silver, Gold, Platinum

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  lifetimePoints: number; // Total points earned (never decreases)

  @Column({ nullable: true })
  nextTierThreshold?: number;

  @Column({ nullable: true })
  @IsOptional()
  loyaltyJoinedAt?: Date;

  // Preferences
  @Column({ type: "json", nullable: true })
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    marketing: {
      newsletter: boolean;
      promotions: boolean;
      newProducts: boolean;
    };
    privacy: {
      profileVisible: boolean;
      shareData: boolean;
    };
    language: string;
    currency: string;
    timezone: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Foreign key reference
  @Column({ nullable: true })
  groupId?: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // Methods
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get defaultAddress() {
    return this.addresses?.find((addr) => addr.isDefault);
  }

  // Loyalty Program Methods
  addLoyaltyPoints(points: number): void {
    this.loyaltyPoints += points;
    this.lifetimePoints += points;
    this.updateLoyaltyTier();
  }

  redeemLoyaltyPoints(points: number): boolean {
    if (this.loyaltyPoints >= points) {
      this.loyaltyPoints -= points;
      return true;
    }
    return false;
  }

  updateLoyaltyTier(): void {
    const tiers = [
      { name: "Bronze", threshold: 0 },
      { name: "Silver", threshold: 1000 },
      { name: "Gold", threshold: 5000 },
      { name: "Platinum", threshold: 15000 },
    ];

    let currentTier = "Bronze";
    let nextThreshold = 1000;

    for (let i = 0; i < tiers.length; i++) {
      if (this.lifetimePoints >= tiers[i].threshold) {
        currentTier = tiers[i].name;
        nextThreshold = i < tiers.length - 1 ? tiers[i + 1].threshold : null;
      }
    }

    this.loyaltyTier = currentTier;
    this.nextTierThreshold = nextThreshold;
  }

  getLoyaltyMultiplier(): number {
    switch (this.loyaltyTier) {
      case "Silver":
        return 1.2;
      case "Gold":
        return 1.5;
      case "Platinum":
        return 2.0;
      default:
        return 1.0; // Bronze
    }
  }

  getAvailableDiscounts(): Array<
    { type: string; value: number; description: string } | undefined
  > {
    const discounts = [];

    // Birthday discount
    if (this.dateOfBirth) {
      const today = new Date();
      const birthday = new Date(this.dateOfBirth);
      if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
        discounts.push({
          type: "birthday",
          value: 15,
          description: "Happy Birthday! 15% off your purchase",
        });
      }
    }

    // Loyalty tier discounts
    switch (this.loyaltyTier) {
      case "Silver":
        discounts.push({
          type: "loyalty",
          value: 5,
          description: "Silver member 5% discount",
        });
        break;
      case "Gold":
        discounts.push({
          type: "loyalty",
          value: 10,
          description: "Gold member 10% discount",
        });
        break;
      case "Platinum":
        discounts.push({
          type: "loyalty",
          value: 15,
          description: "Platinum member 15% discount",
        });
        break;
    }

    // First-time buyer discount
    if (this.ordersCount === 0) {
      discounts.push({
        type: "first_time",
        value: 10,
        description: "First-time buyer 10% discount",
      });
    }

    return discounts;
  }

  toJSON() {
    const {
      password,
      passwordResetToken,
      emailVerificationToken,
      ...customer
    } = this;
    return {
      ...customer,
      availableDiscounts: this.getAvailableDiscounts(),
      loyaltyMultiplier: this.getLoyaltyMultiplier(),
    };
  }
}
