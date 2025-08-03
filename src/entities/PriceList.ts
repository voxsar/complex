import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { PriceListStatus } from "../enums/price_list_status";
import { PriceListType } from "../enums/price_list_type";

@Entity("price_lists")
export class PriceList {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: PriceListStatus,
    default: PriceListStatus.DRAFT,
  })
  status: PriceListStatus;

  @Column({
    type: "enum",
    enum: PriceListType,
    default: PriceListType.SALE,
  })
  type: PriceListType;

  @Column({ default: [] })
  customerGroupIds: string[];

  @Column({ default: [] })
  salesChannelIds: string[];

  @Column({ nullable: true })
  @IsOptional()
  startsAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  endsAt?: Date;

  @Column({ default: [] })
  prices: Array<{
    id: string;
    productId: string;
    variantId?: string;
    currency: string;
    amount: number;
    minQuantity?: number;
    maxQuantity?: number;
  }>;

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
  }

  // Virtual properties
  get isActive(): boolean {
    if (this.status !== PriceListStatus.ACTIVE) return false;
    
    const now = new Date();
    if (this.startsAt && now < this.startsAt) return false;
    if (this.endsAt && now > this.endsAt) return false;
    
    return true;
  }

  get pricesCount(): number {
    return this.prices?.length || 0;
  }

  // Helper methods
  getPriceForProduct(productId: string, variantId?: string, currency: string = 'USD', quantity: number = 1) {
    return this.prices?.find(price => {
      if (price.productId !== productId) return false;
      if (variantId && price.variantId && price.variantId !== variantId) return false;
      if (price.currency !== currency) return false;
      if (price.minQuantity && quantity < price.minQuantity) return false;
      if (price.maxQuantity && quantity > price.maxQuantity) return false;
      return true;
    });
  }

  getApplicablePrices(currency: string = 'USD') {
    return this.prices?.filter(price => price.currency === currency) || [];
  }
}
