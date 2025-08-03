import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { CustomerStatus } from "../enums/customer_status"; // Assuming CustomerStatus is defined in a separate file

@Entity("customers")
export class Customer {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  firstName: string;

  @Column()
  @IsNotEmpty()
  lastName: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @IsOptional()
  phone?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({
    type: "enum",
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @Column({ nullable: true })
  @IsOptional()
  dateOfBirth?: Date;

  @Column({ default: false })
  acceptsMarketing: boolean;

  @Column({ default: [] })
  addresses: Array<{
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
    isDefault: boolean;
  }>;

  @Column({ nullable: true })
  @IsOptional()
  taxExempt?: boolean;

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  note?: string;

  @Column({ nullable: true })
  @IsOptional()
  avatar?: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column("int", { default: 0 })
  ordersCount: number;

  @Column({ nullable: true })
  @IsOptional()
  lastOrderAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Foreign key reference
  @Column({ nullable: true })
  groupId?: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // Methods
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get defaultAddress() {
    return this.addresses?.find((addr) => addr.isDefault);
  }
}
