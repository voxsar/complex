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
import { IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import { CollectionType } from "../enums/collection_type"; // Assuming CollectionType is defined in a separate file

@Entity("collections")
export class Collection {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: CollectionType,
    default: CollectionType.MANUAL,
  })
  type: CollectionType;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  @IsOptional()
  image?: string;

  @Column({ default: [] })
  productIds: string[];

  // For automated collections - condition rules
  @Column({ nullable: true })
  conditions?: {
    type: "all" | "any";
    rules: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };

  @Column({ nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  seoTitle?: string;

  @Column({ nullable: true })
  @IsOptional()
  seoDescription?: string;

  @Column({ nullable: true })
  @IsOptional()
  seoKeywords?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.title) {
      this.slug = slugify(this.title, { lower: true, strict: true });
    }
  }
}
