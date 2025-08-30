import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsUUID, IsInt, Min, Max, IsOptional } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { ReviewStatus } from "../enums/review_status";

@Entity("reviews")
export class Review {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  productId: string;

  @Column()
  @IsNotEmpty()
  customerId: string;

  @Column()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Column({ nullable: true })
  @IsOptional()
  comment?: string;

  @Column({
    type: "enum",
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
