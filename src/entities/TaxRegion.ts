import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsNumber, Min, Max } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { TaxRegionStatus } from "../enums/tax_region_status";
import { TaxTargetType } from "../enums/tax_target_type";

@Entity("tax_regions")
export class TaxRegion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column()
  @IsNotEmpty()
  countryCode: string; // ISO 3166-1 alpha-2 country code (e.g., "US", "CA")

  @Column({ nullable: true })
  @IsOptional()
  subdivisionCode?: string; // ISO 3166-2 subdivision code (e.g., "US-CA", "CA-ON")

  @Column({
    type: "enum",
    enum: TaxRegionStatus,
    default: TaxRegionStatus.ACTIVE,
  })
  status: TaxRegionStatus;

  @Column({ nullable: true })
  @IsOptional()
  parentRegionId?: string; // For sublevel regions

  @Column({ default: false })
  isDefault: boolean; // Whether this is the default region for the country

  @Column({ default: false })
  sublevelEnabled: boolean; // Whether this region supports sublevels

  // Default tax rate for this region
  @Column({ nullable: true })
  @IsOptional()
  defaultTaxRateName?: string;

  @Column("decimal", { precision: 5, scale: 4, nullable: true })
  @IsOptional()
  @Min(0)
  @Max(1)
  defaultTaxRate?: number; // As decimal (e.g., 0.08 for 8%)

  @Column({ nullable: true })
  @IsOptional()
  defaultTaxCode?: string;

  @Column({ default: false })
  defaultCombinableWithParent: boolean; // Whether default rate combines with parent

  // Tax rate overrides for specific products/types
  @Column({ default: [] })
  taxOverrides: Array<{
    id: string;
    name: string;
    rate: number; // As decimal
    code?: string;
    combinable: boolean; // Whether to combine with default rate
    targets: Array<{
      type: TaxTargetType;
      targetId: string; // Product ID or Product Type ID
    }>;
  }>;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    // Placeholder for any additional initialization logic
  }

  // Computed properties
  get hasDefaultTaxRate(): boolean {
    return this.defaultTaxRate !== null && this.defaultTaxRate !== undefined;
  }

  get isSubregion(): boolean {
    return !!this.parentRegionId;
  }

  get overridesCount(): number {
    return this.taxOverrides?.length || 0;
  }

  // Helper methods
  getTaxRateForProduct(productId: string, productType?: string): number {
    let applicableRate = this.defaultTaxRate || 0;
    let combinableOverrides = 0;

    // Check for product-specific overrides
    const productOverride = this.taxOverrides?.find(override =>
      override.targets.some(target => 
        target.type === TaxTargetType.PRODUCT && target.targetId === productId
      )
    );

    if (productOverride) {
      if (productOverride.combinable) {
        combinableOverrides += productOverride.rate;
      } else {
        return productOverride.rate;
      }
    }

    // Check for product type overrides if no specific product override
    if (!productOverride && productType) {
      const typeOverride = this.taxOverrides?.find(override =>
        override.targets.some(target => 
          target.type === TaxTargetType.PRODUCT_TYPE && target.targetId === productType
        )
      );

      if (typeOverride) {
        if (typeOverride.combinable) {
          combinableOverrides += typeOverride.rate;
        } else {
          return typeOverride.rate;
        }
      }
    }

    return applicableRate + combinableOverrides;
  }

  addTaxOverride(override: {
    name: string;
    rate: number;
    code?: string;
    combinable: boolean;
    targets: Array<{ type: TaxTargetType; targetId: string }>;
  }) {
    const newOverride = {
      id: uuidv4(),
      ...override
    };

    this.taxOverrides = [...(this.taxOverrides || []), newOverride];
    return newOverride;
  }

  updateTaxOverride(overrideId: string, updates: Partial<{
    name: string;
    rate: number;
    code?: string;
    combinable: boolean;
    targets: Array<{ type: TaxTargetType; targetId: string }>;
  }>) {
    const overrideIndex = this.taxOverrides?.findIndex(o => o.id === overrideId);
    if (overrideIndex !== undefined && overrideIndex >= 0) {
      this.taxOverrides[overrideIndex] = {
        ...this.taxOverrides[overrideIndex],
        ...updates
      };
      return this.taxOverrides[overrideIndex];
    }
    return null;
  }

  removeTaxOverride(overrideId: string): boolean {
    const initialLength = this.taxOverrides?.length || 0;
    this.taxOverrides = this.taxOverrides?.filter(o => o.id !== overrideId) || [];
    return this.taxOverrides.length < initialLength;
  }
}
