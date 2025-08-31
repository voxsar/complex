import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";

import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsEnum,
} from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity("product-options")
export class ProductOption {
  @PrimaryColumn("uuid")
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

  /**
   * UI input type for the option. Allowed values: select, radio, color, text
   */
  @Column({ default: "select" })
  @IsEnum(["select", "radio", "color", "text"])

  inputType: string; // Accepted values: "select", "radio", "color", "text"


  @Column({ type: "simple-json", nullable: true })
  values: Array<{
    id: string;
    value: string;
    displayValue?: string;
    colorCode?: string; // For color options
    imageUrl?: string;
    isDefault?: boolean;
    sortOrder?: number;
  }>;

  @Column("simple-array")
  productIds: string[]; // Products that use this option

  @Column({ type: "simple-json", nullable: true })
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
