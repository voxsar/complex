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
import { ShippingRateType } from "../enums/shipping_rate_type";

@Entity("shipping_rates")
export class ShippingRate {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column()
  @IsNotEmpty()
  shippingZoneId: string; // Reference to ShippingZone

  @Column()
  @IsNotEmpty()
  shippingProviderId?: string; // Reference to ShippingProvider

  @Column({
    type: "enum",
    enum: ShippingRateType,
    default: ShippingRateType.FLAT_RATE,
  })
  type: ShippingRateType;

  // Flat rate pricing
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  flatRate?: number;

  // Weight-based pricing
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightRate?: number; // Rate per weight unit

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWeight?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeight?: number;

  // Price-based pricing
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceRate?: number; // Percentage of order total

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // Free shipping conditions
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number; // Order total for free shipping

  // Delivery time estimates
  @Column({ nullable: true })
  @IsOptional()
  minDeliveryDays?: number;

  @Column({ nullable: true })
  @IsOptional()
  maxDeliveryDays?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @IsOptional()
  priority?: number; // Display order priority

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
