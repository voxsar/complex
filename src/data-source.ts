import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Import MongoDB-compatible entities
import { Product } from "./entities/Product";
import { Category } from "./entities/Category";
import { Collection } from "./entities/Collection";
import { Inventory } from "./entities/Inventory";
import { Customer } from "./entities/Customer";
import { CustomerGroup } from "./entities/CustomerGroup";
import { Order } from "./entities/Order";
import { Payment } from "./entities/Payment";
import { Promotion } from "./entities/Promotion";
import { Campaign } from "./entities/Campaign";
import { ProductOption } from "./entities/ProductOption";

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
    Customer,
    CustomerGroup,
    Order,
    Payment,
    Promotion,
    Campaign,
  ],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
