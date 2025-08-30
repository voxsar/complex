import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, IsDecimal } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { PromotionType } from "../enums/promotion_type"; // Assuming PromotionType is defined in a separate file
import { PromotionStatus } from "../enums/promotion_status"; // Assuming PromotionStatus is defined
import { PromotionTargetType } from "../enums/promotion_target_type"; // Assuming PromotionTargetType is defined in a separate file

@Entity("promotions")
export class Promotion {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: PromotionType,
  })
  type: PromotionType;

  @Column({
    type: "enum",
    enum: PromotionStatus,
    default: PromotionStatus.INACTIVE,
  })
  status: PromotionStatus;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsDecimal()
  @Min(0)
  discountValue?: number; // percentage or fixed amount

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsDecimal()
  @Min(0)
  minimumOrderAmount?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsDecimal()
  @Min(0)
  maximumDiscountAmount?: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  usageCount: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerCustomer?: number;

  @Column({ nullable: true })
  startsAt?: Date;

  @Column({ nullable: true })
  endsAt?: Date;

  @Column({
    type: "enum",
    enum: PromotionTargetType,
    default: PromotionTargetType.ALL,
  })
  targetType: PromotionTargetType;

  @Column({ default: [] })
  targetIds: string[]; // Product, Category, Collection, or CustomerGroup IDs

  @Column({ default: [] })
  applicableProductIds: string[];

  @Column({ default: [] })
  excludedProductIds: string[];

  @Column({ default: [] })
  applicableCustomerGroupIds: string[];

  @Column({ default: [] })
  excludedCustomerIds: string[];

  // For Buy X Get Y promotions
  @Column({ nullable: true })
  buyXGetYRules?: {
    buyQuantity: number;
    getQuantity: number;
    buyProductIds?: string[];
    getProductIds?: string[];
    getDiscountType: "percentage" | "fixed_amount";
    getDiscountValue: number;
  };

  @Column({ default: true })
  @IsBoolean()
  combineWithOtherPromotions: boolean;

  @Column({ default: 0 })
  priority: number; // Higher number = higher priority

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isActive(): boolean {
    if (this.status !== PromotionStatus.ACTIVE) return false;
    
    const now = new Date();
    if (this.startsAt && now < this.startsAt) return false;
    if (this.endsAt && now > this.endsAt) return false;
    
    if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
    
    return true;
  }

  get isExpired(): boolean {
    if (this.endsAt && new Date() > this.endsAt) return true;
    if (this.usageLimit && this.usageCount >= this.usageLimit) return true;
    return false;
  }

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
