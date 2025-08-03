import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { CampaignType } from "../enums/campaign_type"; // Assuming CampaignType is defined in a separate file
import { CampaignStatus } from "../enums/campaign_status"; // Assuming CampaignStatus is defined in a separate file
import { CampaignTargetType } from "../enums/campaign_target_type"; // Assuming CampaignTarget


@Entity("campaigns")
export class Campaign {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: CampaignType,
  })
  type: CampaignType;

  @Column({
    type: "enum",
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({
    type: "enum",
    enum: CampaignTargetType,
  })
  targetType: CampaignTargetType;

  @Column({ default: [] })
  targetCustomerIds: string[];

  @Column({ default: [] })
  targetCustomerGroupIds: string[];

  @Column({ nullable: true })
  targetCriteria?: {
    type: "all" | "any";
    rules: Array<{
      field: string; // e.g., "totalSpent", "lastOrderDate", "location"
      operator: string; // e.g., "gte", "lte", "eq", "contains"
      value: any;
    }>;
  };

  @Column({ nullable: true })
  @IsOptional()
  subject?: string; // For email campaigns

  @Column({ nullable: true })
  @IsOptional()
  content?: string; // Message content

  @Column({ nullable: true })
  @IsOptional()
  htmlContent?: string; // HTML content for emails

  @Column({ nullable: true })
  @IsOptional()
  templateId?: string;

  @Column({ nullable: true })
  scheduledAt?: Date;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  totalSent: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  totalDelivered: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  totalOpened: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  totalClicked: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  totalBounced: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  totalUnsubscribed: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  totalConverted: number;

  @Column({ nullable: true })
  @IsOptional()
  promotionId?: string; // Associated promotion

  @Column({ nullable: true })
  @IsOptional()
  budget?: number;

  @Column({ nullable: true })
  @IsOptional()
  costPerAction?: number;

  @Column({ default: [] })
  tags: string[];

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get deliveryRate(): number {
    return this.totalSent > 0 ? (this.totalDelivered / this.totalSent) * 100 : 0;
  }

  get openRate(): number {
    return this.totalDelivered > 0 ? (this.totalOpened / this.totalDelivered) * 100 : 0;
  }

  get clickRate(): number {
    return this.totalDelivered > 0 ? (this.totalClicked / this.totalDelivered) * 100 : 0;
  }

  get conversionRate(): number {
    return this.totalDelivered > 0 ? (this.totalConverted / this.totalDelivered) * 100 : 0;
  }

  get bounceRate(): number {
    return this.totalSent > 0 ? (this.totalBounced / this.totalSent) * 100 : 0;
  }

  get unsubscribeRate(): number {
    return this.totalDelivered > 0 ? (this.totalUnsubscribed / this.totalDelivered) * 100 : 0;
  }

  get isActive(): boolean {
    return this.status === CampaignStatus.RUNNING;
  }

  get isCompleted(): boolean {
    return this.status === CampaignStatus.COMPLETED;
  }

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
