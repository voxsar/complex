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

@Entity("inventory_levels")
export class InventoryLevel {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  productId: string;

  @Column({ nullable: true })
  variantId?: string;

  @Column()
  @IsNotEmpty()
  fulfillmentCenterId: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  get isLowStock(): boolean {
    if (this.lowStockThreshold === undefined) return false;
    return this.availableQuantity <= this.lowStockThreshold;
  }

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
