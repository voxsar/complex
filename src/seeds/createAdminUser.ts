import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { UserRole } from "../enums/user_role";

async function createAdminUser() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("✅ Database connected");

    const userRepository = AppDataSource.getRepository(User);

    // Delete any existing admin user
    console.log("🧹 Cleaning up existing admin users...");
    await userRepository.delete({ email: "admin@example.com" });

    // Create admin user
    console.log("👑 Creating admin user...");
    const adminUser = new User();
    adminUser.email = "admin@example.com";
    adminUser.password = "123"; // Will be hashed automatically by the @BeforeInsert hook
    adminUser.firstName = "Admin";
    adminUser.lastName = "User";
    adminUser.role = UserRole.ADMIN;
    adminUser.isActive = true;
    adminUser.isEmailVerified = true; // Skip email verification for dev
    adminUser.roleIds = [];

    const savedUser = await userRepository.save(adminUser);
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@example.com");
    console.log("🔑 Password: 123");
    console.log("🆔 User ID:", savedUser.id);
    console.log("👑 Role:", savedUser.role);

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  createAdminUser();
}

export { createAdminUser };
