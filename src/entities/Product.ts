import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from "class-validator";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import { ProductStatus } from "../enums/product_status"; // Assuming ProductStatus is defined in a separate file
import { ProductType } from "../enums/product_type"; // Assuming ProductType is defined in

@Entity("products")
export class Product {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ nullable: true })
  @IsOptional()
  shortDescription?: string;

  @Column({
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({
    type: "enum",
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type: ProductType;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @Column({ default: [] })
  images: string[];

  @Column({ nullable: true })
  @IsOptional()
  thumbnail?: string;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  seoTitle?: string;

  @Column({ nullable: true })
  @IsOptional()
  seoDescription?: string;

  @Column({ default: [] })
  tags: string[];

  @Column({ default: false })
  @IsBoolean()
  isFeatured: boolean;

  @Column({ default: true })
  @IsBoolean()
  isVisible: boolean;

  @Column({ default: true })
  @IsBoolean()
  trackInventory: boolean;

  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Embedded variants array (for MongoDB, we embed related data)
  @Column({ default: [] })
  variants: Array<{
    id: string;
    title: string;
    sku?: string;
    barcode?: string;
    price: number;
    compareAtPrice?: number;
    cost?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    images: string[];
    isDefault: boolean;
    isActive: boolean;
    metadata?: Record<string, any>;
    optionValues: Array<{
      optionId: string;
      optionName: string;
      valueId: string;
      valueName: string;
      colorCode?: string;
    }>;
    inventory: {
      quantity: number;
      reservedQuantity?: number;
      reorderLevel?: number;
      reorderQuantity?: number;
      trackQuantity: boolean;
      allowBackorder: boolean;
      location?: string;
      warehouse?: string;
    };
  }>;

  // Category and collection references (stored as IDs for MongoDB)
  @Column({ default: [] })
  categoryIds: string[];

  @Column({ default: [] })
  collectionIds: string[];

  @Column({ default: [] })
  optionIds: string[];

  @BeforeInsert()
  @BeforeUpdate()
  generateSlugAndId() {
    if (!this.id) {
      this.id = uuidv4();
    }
    if (this.title) {
      this.slug = slugify(this.title, { lower: true, strict: true });
    }
  }

  // Virtual properties
  get defaultVariant() {
    return this.variants?.find((variant) => variant.isDefault);
  }

  get priceRange(): { min: number; max: number } | null {
    if (!this.variants || this.variants.length === 0) {
      return null;
    }

    const prices = this.variants.map((variant) => variant.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }
}
