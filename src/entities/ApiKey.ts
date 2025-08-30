import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsArray } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { ApiKeyStatus } from "../enums/api_key_status";
import { Permission } from "../enums/permission";
import * as crypto from "crypto";

@Entity("api_keys")
export class ApiKey {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string; // Human-readable name for the API key

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ select: false })
  keyHash: string; // Hashed API key (never store plain text)

  @Column()
  keyPrefix: string; // First 8 characters for identification

  @Column()
  @IsNotEmpty()
  userId: string; // User who created this key

  @Column({
    type: "enum",
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column("simple-array")
  @IsArray()
  permissions: Permission[]; // Specific permissions for this key

  @Column("simple-array")
  @IsArray()
  scopes: string[]; // API scopes (e.g., "orders", "products", "customers")

  @Column({ nullable: true })
  @IsOptional()
  expiresAt?: Date;

  @Column({ nullable: true })
  @IsOptional()
  lastUsedAt?: Date;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ nullable: true })
  @IsOptional()
  rateLimitPerHour?: number; // Rate limit for this specific key

  @Column("simple-array")
  @IsArray()
  allowedIPs: string[]; // IP whitelist

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>; // Additional key metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  // Generate a new API key
  static generateApiKey(): { key: string; hash: string; prefix: string } {
    const key = `ak_${crypto.randomBytes(32).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 8);
    
    return { key, hash, prefix };
  }

  // Verify API key
  verifyKey(providedKey: string): boolean {
    const hash = crypto.createHash('sha256').update(providedKey).digest('hex');
    return hash === this.keyHash;
  }

  // Check if key is valid
  isValid(): boolean {
    if (this.status !== ApiKeyStatus.ACTIVE) {
      return false;
    }

    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  // Update usage statistics
  updateUsage(ipAddress?: string) {
    this.lastUsedAt = new Date();
    this.usageCount += 1;
    this.updatedAt = new Date();
  }

  // Check if IP is allowed
  isIPAllowed(ipAddress: string): boolean {
    if (this.allowedIPs.length === 0) {
      return true; // No IP restrictions
    }
    return this.allowedIPs.includes(ipAddress);
  }
}
