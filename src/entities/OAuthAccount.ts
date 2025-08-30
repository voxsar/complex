import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { IsNotEmpty, IsOptional, IsEmail } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { OAuthProvider } from "../enums/oauth_provider";
import { User } from "./User";

@Entity("oauth_accounts")
export class OAuthAccount {
  @PrimaryColumn("uuid")
  id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  @IsNotEmpty()
  userId: string; // Reference to User entity

  @Column({
    type: "enum",
    enum: OAuthProvider,
  })
  provider: OAuthProvider;

  @Column()
  @IsNotEmpty()
  providerId: string; // ID from OAuth provider (renamed from providerAccountId)

  @Column({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string; // Email from OAuth provider (renamed from providerEmail)

  @Column({ nullable: true })
  @IsOptional()
  providerName?: string;

  @Column({ nullable: true })
  @IsOptional()
  providerAvatar?: string;

  @Column({ nullable: true })
  @IsOptional()
  accessToken?: string;

  @Column({ nullable: true })
  @IsOptional()
  refreshToken?: string;

  @Column({ nullable: true })
  @IsOptional()
  tokenExpiresAt?: Date;

  @Column({ type: "json", nullable: true })
  providerData?: Record<string, any>; // Raw data from provider

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) {
      return false; // No expiration set
    }
    return this.tokenExpiresAt < new Date();
  }
}
