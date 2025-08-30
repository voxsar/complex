import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/Product";
import { ProductStatus } from "../enums/product_status";
import { ProductType } from "../enums/product_type";
import { Category } from "../entities/Category";
import { Customer } from "../entities/Customer";
import { CustomerStatus } from "../enums/customer_status";
import { FulfillmentCenter } from "../entities/FulfillmentCenter";
import { FulfillmentCenterStatus } from "../enums/fulfillment_center_status";
import { InventoryLevel } from "../entities/InventoryLevel";

async function simpleSeed() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Get repositories
    const productRepo = AppDataSource.getRepository(Product);
    const categoryRepo = AppDataSource.getRepository(Category);
    const customerRepo = AppDataSource.getRepository(Customer);
    const fulfillmentCenterRepo = AppDataSource.getRepository(FulfillmentCenter);
    const inventoryLevelRepo = AppDataSource.getRepository(InventoryLevel);

    console.log("🧹 Clearing existing data...");
    await productRepo.clear();
    await categoryRepo.clear();
    await customerRepo.clear();
    await fulfillmentCenterRepo.clear();
    await inventoryLevelRepo.clear();

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

    // Create fulfillment centers
    console.log("🏬 Creating fulfillment centers...");
    const center1 = new FulfillmentCenter();
    center1.name = "East Coast Hub";
    center1.code = "EAST1";
    center1.status = FulfillmentCenterStatus.ACTIVE;
    center1.address1 = "100 East St";
    center1.city = "New York";
    center1.state = "NY";
    center1.country = "USA";
    center1.postalCode = "10001";

    const center2 = new FulfillmentCenter();
    center2.name = "West Coast Hub";
    center2.code = "WEST1";
    center2.status = FulfillmentCenterStatus.ACTIVE;
    center2.address1 = "200 West Ave";
    center2.city = "Los Angeles";
    center2.state = "CA";
    center2.country = "USA";
    center2.postalCode = "90001";

    const savedCenters = await fulfillmentCenterRepo.save([center1, center2]);
    console.log("✅ Fulfillment centers created:", savedCenters.length);

    // Create inventory levels
    console.log("📦 Creating inventory levels...");
    const iphone = savedProducts[0];
    const airpods = savedProducts[1];

    const inventoryLevels = [
      inventoryLevelRepo.create({
        productId: iphone.id,
        variantId: iphone.variants[0].id,
        fulfillmentCenterId: savedCenters[0].id,
        quantity: 20,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        trackQuantity: true,
        allowBackorder: false,
      }),
      inventoryLevelRepo.create({
        productId: iphone.id,
        variantId: iphone.variants[0].id,
        fulfillmentCenterId: savedCenters[1].id,
        quantity: 4,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        trackQuantity: true,
        allowBackorder: false,
      }),
      inventoryLevelRepo.create({
        productId: airpods.id,
        variantId: airpods.variants[0].id,
        fulfillmentCenterId: savedCenters[0].id,
        quantity: 15,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        trackQuantity: true,
        allowBackorder: false,
      }),
      inventoryLevelRepo.create({
        productId: airpods.id,
        variantId: airpods.variants[0].id,
        fulfillmentCenterId: savedCenters[1].id,
        quantity: 2,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        trackQuantity: true,
        allowBackorder: false,
      }),
    ];

    const savedInventoryLevels = await inventoryLevelRepo.save(inventoryLevels);
    console.log("✅ Inventory levels created:", savedInventoryLevels.length);

    // Update category with product IDs
    savedCategory.productIds = savedProducts.map(p => p.id);
    await categoryRepo.save(savedCategory);

    console.log("✅ Simple seed completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - 1 category created`);
    console.log(`   - ${savedCustomers.length} customers created`);
    console.log(`   - ${savedProducts.length} products created`);
    console.log(`   - ${savedCenters.length} fulfillment centers created`);
    console.log(`   - ${savedInventoryLevels.length} inventory levels created`);

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
