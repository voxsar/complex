import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert
} from "typeorm";
import { IsUrl, IsNotEmpty, ArrayMinSize, IsArray } from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity("webhook_endpoints")
export class WebhookEndpoint {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @Column("simple-array")
  @IsArray()
  @ArrayMinSize(1)
  events: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}

export default WebhookEndpoint;
