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
import { ReturnStatus } from "../enums/return_status";
import { ReturnReason } from "../enums/return_reason";

@Entity("order_returns")
export class OrderReturn {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  returnNumber: string;

  @Column({
    type: "enum",
    enum: ReturnStatus,
    default: ReturnStatus.REQUESTED,
  })
  status: ReturnStatus;

  @Column({
    type: "enum",
    enum: ReturnReason,
  })
  reason: ReturnReason;

  @Column()
  @IsNotEmpty()
  orderId: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column("decimal", { precision: 10, scale: 2 })
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
  rejectionReason?: string;

  @Column({ type: "simple-json", nullable: true })
  items: Array<{
    id: string;
    orderItemId: string;
    quantity: number;
    reason: string;
    condition?: string;
    restockable: boolean;
    refundAmount: number;
  }>;

  @Column({ type: "simple-json", nullable: true })
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;

  @Column({ nullable: true })
  @IsOptional()
  processedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  receivedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  refundedAt?: Date;

  @Column({ type: "simple-json", nullable: true })
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
    if (!this.returnNumber) {
      this.returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }

  // Virtual properties
  get itemsCount(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  get isProcessed(): boolean {
    return [ReturnStatus.PROCESSED, ReturnStatus.REFUNDED].includes(this.status);
  }
}
