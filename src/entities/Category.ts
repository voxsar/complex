import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";

@Entity("categories")
export class Category {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ nullable: true })
  @IsOptional()
  image?: string;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  @IsOptional()
  parentId?: string;

  @Column({ default: [] })
  childrenIds: string[];

  @Column({ default: [] })
  productIds: string[];

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
    if (this.name) {
      this.slug = slugify(this.name, { lower: true, strict: true });
    }
  }
}
