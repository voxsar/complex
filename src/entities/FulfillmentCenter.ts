import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { FulfillmentCenterStatus } from "../enums/fulfillment_center_status";

@Entity("fulfillment_centers")
export class FulfillmentCenter {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column()
  @IsNotEmpty()
  code: string; // Unique identifier for the center

  @Column({
    type: "enum",
    enum: FulfillmentCenterStatus,
    default: FulfillmentCenterStatus.ACTIVE,
  })
  status: FulfillmentCenterStatus;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  // Address information
  @Column()
  @IsNotEmpty()
  address1: string;

  @Column({ nullable: true })
  @IsOptional()
  address2?: string;

  @Column()
  @IsNotEmpty()
  city: string;

  @Column()
  @IsNotEmpty()
  state: string;

  @Column()
  @IsNotEmpty()
  country: string;

  @Column()
  @IsNotEmpty()
  postalCode: string;

  // Contact information
  @Column({ nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Column({ nullable: true })
  @IsOptional()
  contactPerson?: string;

  // Operating hours
  @Column({ type: "json", nullable: true })
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  // Capabilities
  @Column({ default: true })
  canShip: boolean;

  @Column({ default: true })
  canReceive: boolean;

  @Column({ default: false })
  canProcess: boolean; // Can process returns/exchanges

  @Column({ default: false })
  isDefault: boolean; // Default fulfillment center

  // Supported shipping zones
  @Column("simple-array")
  supportedShippingZones: string[]; // Array of shipping zone IDs

  // Priority for order routing
  @Column({ default: 1 })
  priority: number;

  // Geographic coordinates for distance calculations
  @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
  @IsOptional()
  latitude?: number;

  @Column({ type: "decimal", precision: 11, scale: 8, nullable: true })
  @IsOptional()
  longitude?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
