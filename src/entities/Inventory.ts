import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsNumber, Min } from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity("inventory")
export class Inventory {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  productId: string;

  @Column({ nullable: true })
  variantId?: string;

  @Column()
  @IsNumber()
  @Min(0)
  quantity: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  reservedQuantity: number;

  @Column({ nullable: true })
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @Column({ default: true })
  trackQuantity: boolean;

  @Column({ default: false })
  allowBackorder: boolean;

  @Column({ nullable: true })
  locationId?: string;

  @Column({ nullable: true })
  warehouseId?: string;

  @Column({ nullable: true })
  sku?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed property
  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  get isLowStock(): boolean {
    if (!this.lowStockThreshold) return false;
    return this.availableQuantity <= this.lowStockThreshold;
  }

  get isOutOfStock(): boolean {
    return this.availableQuantity <= 0;
  }

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
