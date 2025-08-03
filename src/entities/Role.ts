import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsArray } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { Permission } from "../enums/permission";

@Entity("roles")
export class Role {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column({ unique: true })
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: "array" })
  @IsArray()
  permissions: Permission[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystemRole: boolean; // Cannot be deleted/modified

  @Column({ nullable: true })
  @IsOptional()
  priority?: number; // Higher priority roles can manage lower priority roles

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  // Helper method to check if role has specific permission
  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  // Helper method to check if role has any of the specified permissions
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.permissions.includes(permission));
  }

  // Helper method to check if role has all specified permissions
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.permissions.includes(permission));
  }
}
