import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsUrl } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { ShippingProviderType } from "../enums/shipping_provider_type";
import * as crypto from "crypto";

const ALGORITHM = "aes-256-ctr";
const ENCRYPTION_KEY = process.env.SHIPPING_ENCRYPTION_KEY || ""; // 64 hex characters

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("Missing SHIPPING_ENCRYPTION_KEY environment variable");
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("Missing SHIPPING_ENCRYPTION_KEY environment variable");
  }
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString("utf8");
}

@Entity("shipping_providers")
export class ShippingProvider {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({
    type: "enum",
    enum: ShippingProviderType,
  })
  type: ShippingProviderType;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  // API Configuration for real-time rates
  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  apiEndpoint?: string;

  @Column({ nullable: true })
  @IsOptional()
  apiKey?: string;

  @Column({ nullable: true })
  @IsOptional()
  apiSecret?: string;

  @Column({ nullable: true })
  @IsOptional()
  accountNumber?: string;

  @Column({ nullable: true })
  @IsOptional()
  meterNumber?: string; // For FedEx

  @Column({ nullable: true })
  @IsOptional()
  userId?: string; // For UPS

  @Column({ nullable: true })
  @IsOptional()
  password?: string; // For UPS

  // Test/Production mode
  @Column({ default: true })
  isTestMode: boolean;

  // Supported services for this provider
  @Column({ type: "json", nullable: true })
  supportedServices?: {
    serviceCode: string;
    serviceName: string;
    description?: string;
  }[];

  // Default packaging info
  @Column({ type: "json", nullable: true })
  defaultPackaging?: {
    length: number;
    width: number;
    height: number;
    weight: number;
    units: "IMPERIAL" | "METRIC";
  };

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
  private encryptFields() {
    if (this.apiKey && !this.apiKey.includes(":")) {
      this.apiKey = encrypt(this.apiKey);
    }
    if (this.apiSecret && !this.apiSecret.includes(":")) {
      this.apiSecret = encrypt(this.apiSecret);
    }
    if (this.password && !this.password.includes(":")) {
      this.password = encrypt(this.password);
    }
  }

  getCredentials(): {
    apiKey?: string;
    apiSecret?: string;
    password?: string;
  } {
    return {
      apiKey: this.apiKey ? decrypt(this.apiKey) : undefined,
      apiSecret: this.apiSecret ? decrypt(this.apiSecret) : undefined,
      password: this.password ? decrypt(this.password) : undefined,
    };
  }
}
