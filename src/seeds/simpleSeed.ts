import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { Product, ProductStatus, ProductType } from "../entities/Product";
import { Category } from "../entities/Category";
import { Customer, CustomerStatus } from "../entities/Customer";

async function simpleSeed() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Get repositories
    const productRepo = AppDataSource.getRepository(Product);
    const categoryRepo = AppDataSource.getRepository(Category);
    const customerRepo = AppDataSource.getRepository(Customer);

    console.log("🧹 Clearing existing data...");
    await productRepo.clear();
    await categoryRepo.clear();
    await customerRepo.clear();

    // Create a simple category
    console.log("📂 Creating categories...");
    const category = new Category();
    category.name = "Electronics";
    category.description = "Electronic devices and accessories";
    category.isActive = true;
    category.sortOrder = 1;
    category.childrenIds = [];
    category.productIds = [];
    
    const savedCategory = await categoryRepo.save(category);
    console.log("✅ Category created:", savedCategory.name, "ID:", savedCategory.id);

    // Create simple customers
    console.log("👤 Creating customers...");
    const customer1 = new Customer();
    customer1.firstName = "John";
    customer1.lastName = "Doe";
    customer1.email = "john.doe@example.com";
    customer1.phone = "+1234567890";
    customer1.status = CustomerStatus.ACTIVE;
    customer1.totalSpent = 0;
    customer1.ordersCount = 0;
    customer1.addresses = [{
      id: require("uuid").v4(),
      firstName: "John",
      lastName: "Doe",
      address1: "123 Main St",
      city: "New York",
      province: "NY",
      country: "USA",
      zip: "10001",
      isDefault: true,
    }];

    const customer2 = new Customer();
    customer2.firstName = "Jane";
    customer2.lastName = "Smith";
    customer2.email = "jane.smith@example.com";
    customer2.phone = "+1234567891";
    customer2.status = CustomerStatus.ACTIVE;
    customer2.totalSpent = 0;
    customer2.ordersCount = 0;
    customer2.addresses = [{
      id: require("uuid").v4(),
      firstName: "Jane",
      lastName: "Smith",
      address1: "456 Oak Ave",
      city: "Los Angeles",
      province: "CA",
      country: "USA",
      zip: "90210",
      isDefault: true,
    }];

    const savedCustomers = await customerRepo.save([customer1, customer2]);
    console.log("✅ Customers created:", savedCustomers.length);

    // Create simple products
    console.log("📱 Creating products...");
    const product1 = new Product();
    product1.title = "iPhone 15 Pro";
    product1.description = "Latest iPhone with advanced camera system";
    product1.status = ProductStatus.ACTIVE;
    product1.type = ProductType.PHYSICAL;
    product1.images = ["https://example.com/iphone15pro.jpg"];
    product1.tags = ["smartphone", "apple", "premium"];
    product1.categoryIds = [savedCategory.id];
    product1.collectionIds = [];
    product1.variants = [{
      id: require("uuid").v4(),
      title: "iPhone 15 Pro - 128GB",
      sku: "IPH15P-128",
      price: 999.00,
      compareAtPrice: 1099.00,
      cost: 750.00,
      weight: 0.187,
      images: [],
      isDefault: true,
      isActive: true,
      optionValues: [
        { 
          optionId: require("uuid").v4(),
          optionName: "Storage", 
          valueId: require("uuid").v4(),
          valueName: "128GB" 
        },
        { 
          optionId: require("uuid").v4(),
          optionName: "Color", 
          valueId: require("uuid").v4(),
          valueName: "Natural Titanium" 
        }
      ],
      inventory: {
        quantity: 100,
        reservedQuantity: 0,
        trackQuantity: true,
        allowBackorder: false
      }
    }];
    product1.isFeatured = true;
    product1.isVisible = true;

    const product2 = new Product();
    product2.title = "AirPods Pro";
    product2.description = "Premium wireless earbuds with noise cancellation";
    product2.status = ProductStatus.ACTIVE;
    product2.type = ProductType.PHYSICAL;
    product2.images = ["https://example.com/airpods-pro.jpg"];
    product2.tags = ["audio", "apple", "wireless"];
    product2.categoryIds = [savedCategory.id];
    product2.collectionIds = [];
    product2.variants = [{
      id: require("uuid").v4(),
      title: "AirPods Pro - White",
      sku: "AIRPODS-PRO",
      price: 249.00,
      compareAtPrice: 279.00,
      cost: 150.00,
      weight: 0.056,
      images: [],
      isDefault: true,
      isActive: true,
      optionValues: [
        { 
          optionId: require("uuid").v4(),
          optionName: "Color", 
          valueId: require("uuid").v4(),
          valueName: "White" 
        }
      ],
      inventory: {
        quantity: 50,
        reservedQuantity: 0,
        trackQuantity: true,
        allowBackorder: false
      }
    }];
    product2.isFeatured = false;
    product2.isVisible = true;

    const savedProducts = await productRepo.save([product1, product2]);
    console.log("✅ Products created:", savedProducts.length);

    // Update category with product IDs
    savedCategory.productIds = savedProducts.map(p => p.id);
    await categoryRepo.save(savedCategory);

    console.log("✅ Simple seed completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - 1 category created`);
    console.log(`   - ${savedCustomers.length} customers created`);
    console.log(`   - ${savedProducts.length} products created`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seed function
simpleSeed().catch(console.error);
