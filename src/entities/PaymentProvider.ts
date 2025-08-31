import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from "typeorm";
import { IsNotEmpty, IsEnum, IsOptional } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { PaymentProviderType } from "../enums/payment_provider_type";

@Entity("payment_providers")
export class PaymentProvider {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ type: "enum", enum: PaymentProviderType })
  @IsEnum(PaymentProviderType)
  type: PaymentProviderType;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  config?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
