import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";

// Import routes
import productRoutes from "./routes/products";
import categoryRoutes from "./routes/categories";
import customerRoutes from "./routes/customers";
// TODO: Fix and re-import other routes
// import orderRoutes from "./routes/orders";
// import paymentRoutes from "./routes/payments";
// import promotionRoutes from "./routes/promotions";
// import campaignRoutes from "./routes/campaigns";
// import inventoryRoutes from "./routes/inventory";
// import productOptionRoutes from "./routes/productOptions";
// import collectionRoutes from "./routes/collections";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/customers", customerRoutes);
// TODO: Re-create the remaining routes that got corrupted
// app.use("/api/collections", collectionRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/promotions", promotionRoutes);
// app.use("/api/campaigns", campaignRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/product-options", productOptionRoutes);

// 404 handler - simple inline handler for now
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(errorHandler);

// Database connection and server startup
AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Database connected successfully");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  });

export default app;
