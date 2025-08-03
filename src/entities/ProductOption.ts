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

@Entity("product-options")
export class ProductOption {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  name: string; // e.g., "Color", "Size", "Material"

  @Column({ nullable: true })
  @IsOptional()
  displayName?: string;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  position: number;

  @Column({ default: true })
  @IsBoolean()
  isRequired: boolean;

  @Column({ default: "select" })
  inputType: string; // "select", "radio", "color", "text"

  @Column({ default: [] })
  values: Array<{
    id: string;
    value: string;
    displayValue?: string;
    colorCode?: string; // For color options
    imageUrl?: string;
    isDefault?: boolean;
    sortOrder?: number;
  }>;

  @Column({ default: [] })
  productIds: string[]; // Products that use this option

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

  // Helper methods
  addValue(value: string, displayValue?: string, metadata?: any) {
    const optionValue = {
      id: uuidv4(),
      value,
      displayValue: displayValue || value,
      ...metadata,
    };
    this.values.push(optionValue);
    return optionValue;
  }

  removeValue(valueId: string) {
    this.values = this.values.filter(v => v.id !== valueId);
  }

  getValue(valueId: string) {
    return this.values.find(v => v.id === valueId);
  }
}
