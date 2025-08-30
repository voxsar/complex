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
import { ShipmentStatus } from "../enums/shipment_status";

@Entity("shipments")
export class Shipment {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  orderId: string; // Reference to Order

  @Column()
  @IsNotEmpty()
  fulfillmentCenterId: string; // Reference to FulfillmentCenter

  @Column()
  @IsNotEmpty()
  shippingProviderId: string; // Reference to ShippingProvider

  @Column()
  @IsNotEmpty()
  shippingRateId: string; // Reference to ShippingRate used

  @Column({
    type: "enum",
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Column({ nullable: true })
  @IsOptional()
  trackingNumber?: string;

  @Column({ nullable: true })
  @IsOptional()
  serviceType?: string; // e.g., "Ground", "Express", "Overnight"

  // Shipping addresses
  @Column({ type: "json" })
  fromAddress: {
    name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };

  @Column({ type: "json" })
  toAddress: {
    name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };

  // Package information
  @Column({ type: "json" })
  packages: {
    id: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    units: "IMPERIAL" | "METRIC";
    items: {
      productId: string;
      variantId?: string;
      quantity: number;
      description: string;
    }[];
  }[];

  // Costs
  @Column("decimal", { precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  shippingCost: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceCost?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number;

  // Delivery estimates
  @Column({ nullable: true })
  @IsOptional()
  estimatedDeliveryDate?: Date;

  @Column({ nullable: true })
  @IsOptional()
  actualDeliveryDate?: Date;

  // Shipping label
  @Column({ nullable: true })
  @IsOptional()
  labelUrl?: string;

  @Column({ nullable: true })
  @IsOptional()
  labelFormat?: string; // "PDF", "PNG", "ZPL"

  // Tracking events
  @Column({ type: "json", default: [] })
  trackingEvents: {
    status: string;
    description: string;
    location?: string;
    timestamp: Date;
  }[];

  // Additional metadata
  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  @IsOptional()
  shippedAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  deliveredAt?: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
