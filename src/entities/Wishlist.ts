import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsArray, IsNotEmpty } from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity("wishlists")
export class Wishlist {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  @IsNotEmpty()
  customerId: string;

  @Column({ default: [] })
  @IsArray()
  productIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}

export default Wishlist;
