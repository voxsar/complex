import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity("customer-groups")
export class CustomerGroup {
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

  @Column({ default: 0 })
  discountPercentage: number;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ default: [] })
  customerIds: string[];

  // Automatic group criteria
  @Column({ nullable: true })
  criteria?: {
    type: "all" | "any";
    rules: Array<{
      field: string; // e.g., "totalSpent", "orderCount", "email"
      operator: string; // e.g., "gte", "lte", "eq", "contains"
      value: any;
    }>;
  };

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}
