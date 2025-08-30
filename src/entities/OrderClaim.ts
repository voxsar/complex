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
import { ClaimStatus } from "../enums/claim_status";
import { ClaimType } from "../enums/claim_type";

@Entity("order_claims")
export class OrderClaim {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  claimNumber: string;

  @Column({
    type: "enum",
    enum: ClaimStatus,
    default: ClaimStatus.REQUESTED,
  })
  status: ClaimStatus;

  @Column({
    type: "enum",
    enum: ClaimType,
  })
  type: ClaimType;

  @Column()
  @IsNotEmpty()
  orderId: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  refundAmount: number;

  @Column()
  @IsNotEmpty()
  currency: string;

  @Column({ nullable: true })
  @IsOptional()
  customerNote?: string;

  @Column({ nullable: true })
  @IsOptional()
  adminNote?: string;

  @Column({ nullable: true })
  @IsOptional()
  resolutionNote?: string;

  @Column({ default: [] })
  items: Array<{
    id: string;
    orderItemId: string;
    quantity: number;
    description: string;
    images: string[];
    replacement?: {
      productId: string;
      variantId: string;
      quantity: number;
    };
  }>;

  @Column({ default: [] })
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;

  @Column({ nullable: true })
  @IsOptional()
  resolvedAt?: Date;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
    if (!this.claimNumber) {
      this.claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }

  // Virtual properties
  get itemsCount(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  get isResolved(): boolean {
    return [ClaimStatus.RESOLVED].includes(this.status);
  }
}
