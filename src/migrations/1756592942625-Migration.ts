import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1756592942625 implements MigrationInterface {
    name = 'Migration1756592942625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`permissions\` text NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`isSystemRole\` tinyint NOT NULL DEFAULT 0, \`priority\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`api_keys\` (\`id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`keyHash\` varchar(255) NOT NULL, \`keyPrefix\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`status\` enum ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE', \`permissions\` text NOT NULL, \`scopes\` text NOT NULL, \`expiresAt\` datetime NULL, \`lastUsedAt\` datetime NULL, \`usageCount\` int NOT NULL DEFAULT '0', \`rateLimitPerHour\` int NULL, \`allowedIPs\` text NOT NULL, \`metadata\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`oauth_accounts\` (\`id\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`provider\` enum ('GOOGLE', 'FACEBOOK', 'GITHUB', 'APPLE', 'TWITTER') NOT NULL, \`providerId\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`providerName\` varchar(255) NULL, \`providerAvatar\` varchar(255) NULL, \`accessToken\` varchar(255) NULL, \`refreshToken\` varchar(255) NULL, \`tokenExpiresAt\` datetime NULL, \`providerData\` json NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`lastLoginAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`wishlists\` (\`id\` varchar(255) NOT NULL, \`customerId\` varchar(255) NOT NULL, \`productIds\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reviews\` (\`id\` varchar(255) NOT NULL, \`productId\` varchar(255) NOT NULL, \`customerId\` varchar(255) NOT NULL, \`rating\` int NOT NULL, \`comment\` varchar(255) NULL, \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`subdivisionCode\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`parentRegionId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`isDefault\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`sublevelEnabled\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`defaultTaxRateName\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`defaultTaxRate\` decimal(5,4) NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`defaultTaxCode\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`defaultCombinableWithParent\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`taxOverrides\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`metadata\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`oauth_accounts\` ADD CONSTRAINT \`FK_4c22f13249ce02f89dc6d226e9c\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`oauth_accounts\` DROP FOREIGN KEY \`FK_4c22f13249ce02f89dc6d226e9c\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`updatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`createdAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD \`id\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`metadata\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`taxOverrides\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`defaultCombinableWithParent\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`defaultTaxCode\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`defaultTaxRate\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`defaultTaxRateName\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`sublevelEnabled\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`isDefault\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`parentRegionId\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`tax_regions\` DROP COLUMN \`subdivisionCode\``);
        await queryRunner.query(`DROP TABLE \`reviews\``);
        await queryRunner.query(`DROP TABLE \`wishlists\``);
        await queryRunner.query(`DROP TABLE \`oauth_accounts\``);
        await queryRunner.query(`DROP TABLE \`api_keys\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

}
