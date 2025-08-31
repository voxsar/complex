import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  PrimaryColumn,
} from "typeorm";
import { IsEmail, IsNotEmpty, MinLength, IsOptional } from "class-validator";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../enums/user_role"; // Assuming UserRole is defined in a separate file
import { UserAddress } from "../enums/user_address"; // Assuming UserAddress is defined in a separate file

@Entity("users")
export class User {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column({ select: false })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @Column()
  @IsNotEmpty()
  firstName!: string;

  @Column()
  @IsNotEmpty()
  lastName!: string;

  @Column({ nullable: true })
  @IsOptional()
  phone?: string;

  @Column({ nullable: true })
  @IsOptional()
  profilePictureUrl?: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column("simple-array")
  roleIds: string[]; // References to Role entities for RBAC

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpires?: Date;

  @Column({ nullable: true })
  @IsOptional()
  lastLoginIP?: string;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true })
  @IsOptional()
  lockedUntil?: Date;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ type: "json", nullable: true })
  addresses?: UserAddress[];

  @Column({ type: "json", nullable: true })
  preferences?: {
    newsletter: boolean;
    sms: boolean;
    language: string;
    currency: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      // Only hash if it's not already hashed (bcrypt hashes start with $2a$ or $2b$)
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    const { password, passwordResetToken, emailVerificationToken, ...user } = this;
    return user;
  }

  // Check if user is locked due to failed login attempts
  isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  // Increment login attempts and lock if necessary
  incLoginAttempts(): void {
    this.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  // Reset login attempts
  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = undefined;
  }

  // Update last login info
  updateLastLogin(ipAddress?: string): void {
    this.lastLoginAt = new Date();
    this.lastLoginIP = ipAddress;
    this.resetLoginAttempts();
  }

  // Check if user has a specific role
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  // Check if user is staff (admin, manager, or staff)
  isStaff(): boolean {
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF].includes(this.role);
  }
}
