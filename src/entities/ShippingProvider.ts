import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsUrl } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { ShippingProviderType } from "../enums/shipping_provider_type";

@Entity("shipping_providers")
export class ShippingProvider {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({
    type: "enum",
    enum: ShippingProviderType,
  })
  type: ShippingProviderType;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  // API Configuration for real-time rates
  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  apiEndpoint?: string;

  @Column({ nullable: true })
  @IsOptional()
  apiKey?: string;

  @Column({ nullable: true })
  @IsOptional()
  apiSecret?: string;

  @Column({ nullable: true })
  @IsOptional()
  accountNumber?: string;

  @Column({ nullable: true })
  @IsOptional()
  meterNumber?: string; // For FedEx

  @Column({ nullable: true })
  @IsOptional()
  userId?: string; // For UPS

  @Column({ nullable: true })
  @IsOptional()
  password?: string; // For UPS

  // Test/Production mode
  @Column({ default: true })
  isTestMode: boolean;

  // Supported services for this provider
  @Column({ type: "json", nullable: true })
  supportedServices?: {
    serviceCode: string;
    serviceName: string;
    description?: string;
  }[];

  // Default packaging info
  @Column({ type: "json", nullable: true })
  defaultPackaging?: {
    length: number;
    width: number;
    height: number;
    weight: number;
    units: "IMPERIAL" | "METRIC";
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
