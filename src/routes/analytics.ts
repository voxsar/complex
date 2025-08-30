import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/Product";
import { Order } from "../entities/Order";
import { Customer } from "../entities/Customer";

const router = Router();

// Get dashboard statistics
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const orderRepository = AppDataSource.getRepository(Order);
    const customerRepository = AppDataSource.getRepository(Customer);

    const [totalProducts, totalOrders, totalCustomers] = await Promise.all([
      productRepository.count(),
      orderRepository.count(),
      customerRepository.count()
    ]);

    // Calculate total revenue from orders
    const orders = await orderRepository.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    const stats = {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    };

    res.json(stats);
  } catch (error) {
    logger.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// Get sales data by period
router.get("/sales", async (req: Request, res: Response) => {
  try {
    const { period = "30d" } = req.query;
    const orderRepository = AppDataSource.getRepository(Order);

    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const orders = await orderRepository.find({
      where: {},
      order: { createdAt: "ASC" }
    });

    // Filter orders by date (MongoDB doesn't support date operators in the same way)
    const filteredOrders = orders.filter(order => order.createdAt >= startDate);

    // Group orders by date
    const salesByDate = filteredOrders.reduce((acc: any, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, sales: 0, orders: 0 };
      }
      acc[date].sales += order.total || 0;
      acc[date].orders += 1;
      return acc;
    }, {});

    const salesData = Object.values(salesByDate);

    res.json({
      period,
      data: salesData
    });
  } catch (error) {
    logger.error("Error fetching sales data:", error);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});

// Get top products
router.get("/top-products", async (req: Request, res: Response) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const productRepository = AppDataSource.getRepository(Product);

    // Get all orders and count product sales
    const orders = await orderRepository.find();
    const productSales: { [key: string]: number } = {};

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.productId) {
            productSales[item.productId] = (productSales[item.productId] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    // Get top 10 products by sales
    const sortedProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const topProducts = await Promise.all(
      sortedProducts.map(async ([productId, sales]) => {
        const product = await productRepository.findOne({ where: { id: productId } });
        return {
          id: productId,
          title: product?.title || 'Unknown Product',
          sales,
          revenue: product?.variants?.[0]?.price ? product.variants[0].price * sales : 0
        };
      })
    );

    res.json(topProducts);
  } catch (error) {
    logger.error("Error fetching top products:", error);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
});

// Get customer statistics
router.get("/customers", async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    const orderRepository = AppDataSource.getRepository(Order);

    // Get customers created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allCustomers = await customerRepository.find();
    const newCustomers = allCustomers.filter(customer => customer.createdAt >= thirtyDaysAgo).length;

    // Get returning customers (customers with more than 1 order)
    const allOrders = await orderRepository.find();
    const customerOrderCounts: { [key: string]: number } = {};

    allOrders.forEach(order => {
      if (order.customerId) {
        customerOrderCounts[order.customerId] = (customerOrderCounts[order.customerId] || 0) + 1;
      }
    });

    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;

    // Calculate average order value
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

    const customerStats = {
      newCustomers,
      returningCustomers,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100
    };

    res.json(customerStats);
  } catch (error) {
    logger.error("Error fetching customer stats:", error);
    res.status(500).json({ error: "Failed to fetch customer statistics" });
  }
});

export default router;
