const { AppDataSource } = require('./dist/data-source');
const { User } = require('./dist/entities/User');

async function checkAdminUser() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("✅ Database connected");

    const userRepository = AppDataSource.getRepository(User);

    // Find the admin user
    const admin = await userRepository.findOne({
      where: { email: "admin@example.com" },
      select: ["id", "email", "password", "firstName", "lastName", "role", "isActive", "isEmailVerified"]
    });

    if (admin) {
      console.log("👤 Admin user found:");
      console.log("📧 Email:", admin.email);
      console.log("🔑 Password hash:", admin.password.substring(0, 20) + "...");
      console.log("👑 Role:", admin.role);
      console.log("✅ Active:", admin.isActive);
      console.log("📨 Email verified:", admin.isEmailVerified);
      
      // Test password comparison
      const bcrypt = require('bcryptjs');
      const passwordMatch = await bcrypt.compare('123', admin.password);
      console.log("🔐 Password '123' matches:", passwordMatch);
      
    } else {
      console.log("❌ Admin user not found");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkAdminUser();
