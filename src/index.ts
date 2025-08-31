import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import i18n, { i18nextMiddleware } from "./utils/i18n";
import logger from "./utils/logger";
import { requestLogger } from "./middleware/requestLogger";

// Import routes
import productRoutes from "./routes/products";
import categoryRoutes from "./routes/categories";
import customerRoutes from "./routes/customers";
import userRoutes from "./routes/users";
import authDemoRoutes from "./routes/auth-demo";
import customerDemoRoutes from "./routes/customer-demo";
import cartRoutes from "./routes/carts";
import orderRoutes from "./routes/orders";
import orderReturnsRoutes from "./routes/order-returns";
import orderClaimsRoutes from "./routes/order-claims";
import orderExchangesRoutes from "./routes/order-exchanges";
import priceListsRoutes from "./routes/price-lists";
import salesChannelsRoutes from "./routes/sales-channels";
import paymentRoutes from "./routes/payments";
import promotionRoutes from "./routes/promotions";
import campaignRoutes from "./routes/campaigns";
import inventoryRoutes from "./routes/inventory";
import productOptionRoutes from "./routes/productOptions";
import taxRegionRoutes from "./routes/tax-regions";
import shippingZoneRoutes from "./routes/shipping-zones";
import shippingRateRoutes from "./routes/shipping-rates";
import fulfillmentCenterRoutes from "./routes/fulfillment-centers";
import shippingProviderRoutes from "./routes/shipping-providers";
import paymentProviderRoutes from "./routes/payment-providers";
import shipmentRoutes from "./routes/shipments";
import adminAuthRoutes from "./routes/admin-auth";
import apiKeyRoutes from "./routes/api-keys";
import roleRoutes from "./routes/roles";
import oauthRoutes from "./routes/oauth";
import paymentIntentRoutes from "./routes/payment-intents";
import savedPaymentMethodRoutes from "./routes/saved-payment-methods";
import webhookRoutes from "./routes/webhooks";
import refundRoutes from "./routes/refunds";
import analyticsRoutes from "./routes/analytics";
import wishlistRoutes from "./routes/wishlists";
import reviewRoutes from "./routes/reviews";
import checkoutRoutes from "./routes/checkout";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import currencyService from "./services/CurrencyService";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Optional APM initialization
let apm: any;
if (process.env.APM_SERVICE_NAME) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    apm = require('elastic-apm-node').start({
      serviceName: process.env.APM_SERVICE_NAME,
    });
    logger.info('APM initialized');
  } catch (err) {
    logger.warn('APM initialization failed', err);
  }
}

// Make currency service available to routes and start rate refresh
app.set("currencyService", currencyService);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // @ts-ignore
    res.status(429).json({ error: req.t("errors.too_many_requests") });
  },
});

// Global Middleware
app.use(i18nextMiddleware.handle(i18n));
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestLogger(apm));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: req.t("health.ok"),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth-demo", authDemoRoutes);
app.use("/api/customer-demo", customerDemoRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-returns", orderReturnsRoutes);
app.use("/api/order-claims", orderClaimsRoutes);
app.use("/api/order-exchanges", orderExchangesRoutes);
app.use("/api/price-lists", priceListsRoutes);
app.use("/api/sales-channels", salesChannelsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/product-options", productOptionRoutes);
app.use("/api/tax-regions", taxRegionRoutes);
app.use("/api/shipping-zones", shippingZoneRoutes);
app.use("/api/shipping-rates", shippingRateRoutes);
app.use("/api/fulfillment-centers", fulfillmentCenterRoutes);
app.use("/api/shipping-providers", shippingProviderRoutes);
app.use("/api/payment-providers", paymentProviderRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/checkout", checkoutRoutes);

// Payment Integration Routes
app.use("/api/payment-intents", paymentIntentRoutes);
app.use("/api", savedPaymentMethodRoutes); // This includes /customers/:id/payment-methods and /payment-methods/:id
app.use("/api/webhooks", webhookRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);

// Authentication & Authorization Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/auth/oauth", oauthRoutes);
app.use("/api/admin/api-keys", apiKeyRoutes);
app.use("/api/admin/roles", roleRoutes);

// 404 handler - simple inline handler for now
app.use((req, res) => {
  res.status(404).json({ error: req.t("errors.route_not_found") });
});

// Error handler
app.use(errorHandler);

// Database connection and server startup
AppDataSource.initialize()
  .then(async () => {
    logger.info("✅ Database connected successfully");

    app.listen(PORT, () => {
      logger.info({ port: PORT }, "🚀 Server is running");
      logger.info({ env: process.env.NODE_ENV || "development" }, "📊 Environment");
      logger.info({ url: `http://localhost:${PORT}/health` }, "🔗 Health check");
    });
  })
  .catch((error) => {
    logger.error({ err: error }, "❌ Database connection failed");
    process.exit(1);
  });

export default app;
