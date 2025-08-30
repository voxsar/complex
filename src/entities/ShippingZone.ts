import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsArray } from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity("shipping_zones")
export class ShippingZone {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column()
  @IsArray()
  countries: string[]; // Array of country codes (e.g., ["US", "CA", "MX"])

  @Column()
  @IsArray()
  states: string[]; // Array of state/province codes

  @Column()
  @IsArray()
  cities: string[]; // Array of cities (optional, empty array means all cities)

  @Column()
  @IsArray()
  postalCodes: string[]; // Array of postal code patterns

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @IsOptional()
  priority?: number; // Higher priority zones are checked first

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
