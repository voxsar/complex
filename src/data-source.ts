import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Import MongoDB-compatible entities
import { Product } from "./entities/Product";
import { Category } from "./entities/Category";
import { Collection } from "./entities/Collection";
import { Inventory } from "./entities/Inventory";
import { InventoryLevel } from "./entities/InventoryLevel";
import { Customer } from "./entities/Customer";
import { CustomerGroup } from "./entities/CustomerGroup";
import { Cart } from "./entities/Cart";
import { Order } from "./entities/Order";
import { OrderReturn } from "./entities/OrderReturn";
import { OrderClaim } from "./entities/OrderClaim";
import { OrderExchange } from "./entities/OrderExchange";
import { Payment } from "./entities/Payment";
import { Promotion } from "./entities/Promotion";
import { Campaign } from "./entities/Campaign";
import { ProductOption } from "./entities/ProductOption";
import { PriceList } from "./entities/PriceList";
import { SalesChannel } from "./entities/SalesChannel";
import { User } from "./entities/User";
import { TaxRegion } from "./entities/TaxRegion";
import { ShippingZone } from "./entities/ShippingZone";
import { ShippingRate } from "./entities/ShippingRate";
import { ShippingProvider } from "./entities/ShippingProvider";
import { FulfillmentCenter } from "./entities/FulfillmentCenter";
import { Shipment } from "./entities/Shipment";
import { Role } from "./entities/Role";
import { ApiKey } from "./entities/ApiKey";
import { OAuthAccount } from "./entities/OAuthAccount";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mongodb",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "27017"),
  database: process.env.DB_DATABASE || "ecommerce_db",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [
    Product,
    ProductOption,
    Category,
    Collection,
    Inventory,
    InventoryLevel,
    Customer,
    CustomerGroup,
    Cart,
    Order,
    OrderReturn,
    OrderClaim,
    OrderExchange,
    Payment,
    Promotion,
    Campaign,
    PriceList,
    SalesChannel,
    User,
    TaxRegion,
    ShippingZone,
    ShippingRate,
    ShippingProvider,
    FulfillmentCenter,
    Shipment,
    Role,
    ApiKey,
    OAuthAccount,
  ],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
