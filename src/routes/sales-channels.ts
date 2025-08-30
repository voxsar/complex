import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { SalesChannel } from "../entities/SalesChannel";

const router = Router();

// Get all sales channels with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
      search,
      sortBy = "name",
      sortOrder = "asc"
    } = req.query;

    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const query: any = {};
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [salesChannels, total] = await salesChannelRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { [sortBy as string]: sortOrder === "asc" ? "ASC" : "DESC" }
    });

    res.json({
      salesChannels,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error("Error fetching sales channels:", error);
    res.status(500).json({ error: "Failed to fetch sales channels" });
  }
});

// Get sales channel by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const salesChannel = await salesChannelRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!salesChannel) {
      return res.status(404).json({ error: "Sales channel not found" });
    }

    res.json(salesChannel);
  } catch (error) {
    logger.error("Error fetching sales channel:", error);
    res.status(500).json({ error: "Failed to fetch sales channel" });
  }
});

// Get default sales channel
router.get("/default/channel", async (req: Request, res: Response) => {
  try {
    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const defaultChannel = await salesChannelRepository.findOne({
      where: { isDefault: true, isActive: true }
    });

    if (!defaultChannel) {
      return res.status(404).json({ error: "No default sales channel found" });
    }

    res.json(defaultChannel);
  } catch (error) {
    logger.error("Error fetching default sales channel:", error);
    res.status(500).json({ error: "Failed to fetch default sales channel" });
  }
});

// Create new sales channel
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      isActive = true,
      isDefault = false,
      supportedCurrencies = ['USD'],
      defaultCurrency,
      stockLocationIds = [],
      shippingProfileIds = []
    } = req.body;

    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);

    // If this is set as default, remove default from other channels
    if (isDefault) {
      await salesChannelRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }

    const salesChannel = new SalesChannel();
    salesChannel.name = name;
    salesChannel.description = description;
    salesChannel.isActive = isActive;
    salesChannel.isDefault = isDefault;
    salesChannel.supportedCurrencies = supportedCurrencies;
    salesChannel.defaultCurrency = defaultCurrency || supportedCurrencies[0];
    salesChannel.stockLocationIds = stockLocationIds;
    salesChannel.shippingProfileIds = shippingProfileIds;

    const savedSalesChannel = await salesChannelRepository.save(salesChannel);

    res.status(201).json({
      message: "Sales channel created successfully",
      salesChannel: savedSalesChannel
    });
  } catch (error) {
    logger.error("Error creating sales channel:", error);
    res.status(500).json({ error: "Failed to create sales channel" });
  }
});

// Update sales channel
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      isActive,
      isDefault,
      supportedCurrencies,
      defaultCurrency,
      stockLocationIds,
      shippingProfileIds
    } = req.body;

    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const salesChannel = await salesChannelRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!salesChannel) {
      return res.status(404).json({ error: "Sales channel not found" });
    }

    // If this is being set as default, remove default from other channels
    if (isDefault && !salesChannel.isDefault) {
      await salesChannelRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }

    // Update fields
    if (name !== undefined) salesChannel.name = name;
    if (description !== undefined) salesChannel.description = description;
    if (isActive !== undefined) salesChannel.isActive = isActive;
    if (isDefault !== undefined) salesChannel.isDefault = isDefault;
    if (supportedCurrencies !== undefined) salesChannel.supportedCurrencies = supportedCurrencies;
    if (defaultCurrency !== undefined) salesChannel.defaultCurrency = defaultCurrency;
    if (stockLocationIds !== undefined) salesChannel.stockLocationIds = stockLocationIds;
    if (shippingProfileIds !== undefined) salesChannel.shippingProfileIds = shippingProfileIds;

    const updatedSalesChannel = await salesChannelRepository.save(salesChannel);

    res.json({
      message: "Sales channel updated successfully",
      salesChannel: updatedSalesChannel
    });
  } catch (error) {
    logger.error("Error updating sales channel:", error);
    res.status(500).json({ error: "Failed to update sales channel" });
  }
});

// Set as default sales channel
router.post("/:id/set-default", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const salesChannel = await salesChannelRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!salesChannel) {
      return res.status(404).json({ error: "Sales channel not found" });
    }

    if (!salesChannel.isActive) {
      return res.status(400).json({ error: "Cannot set inactive sales channel as default" });
    }

    // Remove default from all other channels
    await salesChannelRepository.update(
      { isDefault: true },
      { isDefault: false }
    );

    // Set this channel as default
    salesChannel.isDefault = true;
    const updatedSalesChannel = await salesChannelRepository.save(salesChannel);

    res.json({
      message: "Sales channel set as default successfully",
      salesChannel: updatedSalesChannel
    });
  } catch (error) {
    logger.error("Error setting default sales channel:", error);
    res.status(500).json({ error: "Failed to set default sales channel" });
  }
});

// Get supported currencies for a sales channel
router.get("/:id/currencies", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const salesChannel = await salesChannelRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!salesChannel) {
      return res.status(404).json({ error: "Sales channel not found" });
    }

    res.json({
      salesChannelId: salesChannel.id,
      supportedCurrencies: salesChannel.supportedCurrencies,
      defaultCurrency: salesChannel.defaultCurrency
    });
  } catch (error) {
    logger.error("Error fetching sales channel currencies:", error);
    res.status(500).json({ error: "Failed to fetch sales channel currencies" });
  }
});

// Add currency to sales channel
router.post("/:id/currencies", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currency, setAsDefault = false } = req.body;

    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const salesChannel = await salesChannelRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!salesChannel) {
      return res.status(404).json({ error: "Sales channel not found" });
    }

    if (!salesChannel.supportedCurrencies.includes(currency)) {
      salesChannel.supportedCurrencies.push(currency);
    }

    if (setAsDefault || !salesChannel.defaultCurrency) {
      salesChannel.defaultCurrency = currency;
    }

    const updatedSalesChannel = await salesChannelRepository.save(salesChannel);

    res.json({
      message: "Currency added successfully",
      salesChannel: updatedSalesChannel
    });
  } catch (error) {
    logger.error("Error adding currency:", error);
    res.status(500).json({ error: "Failed to add currency" });
  }
});

// Remove currency from sales channel
router.delete("/:id/currencies/:currency", async (req: Request, res: Response) => {
  try {
    const { id, currency } = req.params;
    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const salesChannel = await salesChannelRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!salesChannel) {
      return res.status(404).json({ error: "Sales channel not found" });
    }

    if (salesChannel.supportedCurrencies.length <= 1) {
      return res.status(400).json({ error: "Cannot remove the last supported currency" });
    }

    salesChannel.supportedCurrencies = salesChannel.supportedCurrencies.filter(c => c !== currency);

    // If this was the default currency, set a new default
    if (salesChannel.defaultCurrency === currency) {
      salesChannel.defaultCurrency = salesChannel.supportedCurrencies[0];
    }

    const updatedSalesChannel = await salesChannelRepository.save(salesChannel);

    res.json({
      message: "Currency removed successfully",
      salesChannel: updatedSalesChannel
    });
  } catch (error) {
    logger.error("Error removing currency:", error);
    res.status(500).json({ error: "Failed to remove currency" });
  }
});

// Delete sales channel
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salesChannelRepository = AppDataSource.getRepository(SalesChannel);
    
    const salesChannel = await salesChannelRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!salesChannel) {
      return res.status(404).json({ error: "Sales channel not found" });
    }

    if (salesChannel.isDefault) {
      return res.status(400).json({ error: "Cannot delete the default sales channel" });
    }

    await salesChannelRepository.remove(salesChannel);

    res.json({ message: "Sales channel deleted successfully" });
  } catch (error) {
    logger.error("Error deleting sales channel:", error);
    res.status(500).json({ error: "Failed to delete sales channel" });
  }
});

export default router;
