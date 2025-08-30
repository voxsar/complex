import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty } from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity("sales_channels")
export class SalesChannel {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: [] })
  supportedCurrencies: string[];

  @Column({ nullable: true })
  defaultCurrency?: string;

  @Column({ default: [] })
  stockLocationIds: string[];

  @Column({ default: [] })
  shippingProfileIds: string[];

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

  // Helper methods
  supportsCurrency(currency: string): boolean {
    return this.supportedCurrencies.includes(currency);
  }

  getEffectiveCurrency(requestedCurrency?: string): string {
    if (requestedCurrency && this.supportsCurrency(requestedCurrency)) {
      return requestedCurrency;
    }
    return this.defaultCurrency || this.supportedCurrencies[0] || 'USD';
  }
}
