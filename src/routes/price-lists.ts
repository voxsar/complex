import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { PriceList } from "../entities/PriceList";
import { PriceListStatus } from "../enums/price_list_status";
import { PriceListType } from "../enums/price_list_type";

const router = Router();

// Get all price lists with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      customerGroupId,
      salesChannelId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const query: any = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (customerGroupId) query.customerGroupIds = { $in: [customerGroupId] };
    if (salesChannelId) query.salesChannelIds = { $in: [salesChannelId] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [priceLists, total] = await priceListRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { [sortBy as string]: sortOrder === "asc" ? "ASC" : "DESC" }
    });

    res.json({
      priceLists,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error("Error fetching price lists:", error);
    res.status(500).json({ error: "Failed to fetch price lists" });
  }
});

// Get price list by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const priceList = await priceListRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!priceList) {
      return res.status(404).json({ error: "Price list not found" });
    }

    res.json(priceList);
  } catch (error) {
    logger.error("Error fetching price list:", error);
    res.status(500).json({ error: "Failed to fetch price list" });
  }
});

// Create new price list
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      type = PriceListType.SALE,
      status = PriceListStatus.DRAFT,
      customerGroupIds = [],
      salesChannelIds = [],
      startsAt,
      endsAt,
      prices = []
    } = req.body;

    const priceListRepository = AppDataSource.getRepository(PriceList);

    const priceList = new PriceList();
    priceList.title = title;
    priceList.description = description;
    priceList.type = type;
    priceList.status = status;
    priceList.customerGroupIds = customerGroupIds;
    priceList.salesChannelIds = salesChannelIds;
    priceList.startsAt = startsAt ? new Date(startsAt) : undefined;
    priceList.endsAt = endsAt ? new Date(endsAt) : undefined;
    priceList.prices = prices.map((price: any) => ({
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: price.productId,
      variantId: price.variantId,
      currency: price.currency,
      amount: price.amount,
      minQuantity: price.minQuantity,
      maxQuantity: price.maxQuantity
    }));

    const savedPriceList = await priceListRepository.save(priceList);

    res.status(201).json({
      message: "Price list created successfully",
      priceList: savedPriceList
    });
  } catch (error) {
    logger.error("Error creating price list:", error);
    res.status(500).json({ error: "Failed to create price list" });
  }
});

// Update price list
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      status,
      customerGroupIds,
      salesChannelIds,
      startsAt,
      endsAt,
      prices
    } = req.body;

    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const priceList = await priceListRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!priceList) {
      return res.status(404).json({ error: "Price list not found" });
    }

    // Update fields
    if (title !== undefined) priceList.title = title;
    if (description !== undefined) priceList.description = description;
    if (type !== undefined) priceList.type = type;
    if (status !== undefined) priceList.status = status;
    if (customerGroupIds !== undefined) priceList.customerGroupIds = customerGroupIds;
    if (salesChannelIds !== undefined) priceList.salesChannelIds = salesChannelIds;
    if (startsAt !== undefined) priceList.startsAt = startsAt ? new Date(startsAt) : undefined;
    if (endsAt !== undefined) priceList.endsAt = endsAt ? new Date(endsAt) : undefined;
    if (prices !== undefined) {
      priceList.prices = prices.map((price: any) => ({
        id: price.id || `price_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: price.productId,
        variantId: price.variantId,
        currency: price.currency,
        amount: price.amount,
        minQuantity: price.minQuantity,
        maxQuantity: price.maxQuantity
      }));
    }

    const updatedPriceList = await priceListRepository.save(priceList);

    res.json({
      message: "Price list updated successfully",
      priceList: updatedPriceList
    });
  } catch (error) {
    logger.error("Error updating price list:", error);
    res.status(500).json({ error: "Failed to update price list" });
  }
});

// Add price to price list
router.post("/:id/prices", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId, variantId, currency, amount, minQuantity, maxQuantity } = req.body;

    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const priceList = await priceListRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!priceList) {
      return res.status(404).json({ error: "Price list not found" });
    }

    const newPrice = {
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId,
      variantId,
      currency,
      amount,
      minQuantity,
      maxQuantity
    };

    priceList.prices = [...(priceList.prices || []), newPrice];

    const updatedPriceList = await priceListRepository.save(priceList);

    res.json({
      message: "Price added successfully",
      priceList: updatedPriceList,
      price: newPrice
    });
  } catch (error) {
    logger.error("Error adding price:", error);
    res.status(500).json({ error: "Failed to add price" });
  }
});

// Update specific price in price list
router.put("/:id/prices/:priceId", async (req: Request, res: Response) => {
  try {
    const { id, priceId } = req.params;
    const { currency, amount, minQuantity, maxQuantity } = req.body;

    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const priceList = await priceListRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!priceList) {
      return res.status(404).json({ error: "Price list not found" });
    }

    const priceIndex = priceList.prices.findIndex(p => p.id === priceId);
    if (priceIndex === -1) {
      return res.status(404).json({ error: "Price not found" });
    }

    // Update the price
    priceList.prices[priceIndex] = {
      ...priceList.prices[priceIndex],
      ...(currency !== undefined && { currency }),
      ...(amount !== undefined && { amount }),
      ...(minQuantity !== undefined && { minQuantity }),
      ...(maxQuantity !== undefined && { maxQuantity })
    };

    const updatedPriceList = await priceListRepository.save(priceList);

    res.json({
      message: "Price updated successfully",
      priceList: updatedPriceList,
      price: priceList.prices[priceIndex]
    });
  } catch (error) {
    logger.error("Error updating price:", error);
    res.status(500).json({ error: "Failed to update price" });
  }
});

// Remove price from price list
router.delete("/:id/prices/:priceId", async (req: Request, res: Response) => {
  try {
    const { id, priceId } = req.params;

    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const priceList = await priceListRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!priceList) {
      return res.status(404).json({ error: "Price list not found" });
    }

    priceList.prices = priceList.prices.filter(p => p.id !== priceId);

    const updatedPriceList = await priceListRepository.save(priceList);

    res.json({
      message: "Price removed successfully",
      priceList: updatedPriceList
    });
  } catch (error) {
    logger.error("Error removing price:", error);
    res.status(500).json({ error: "Failed to remove price" });
  }
});

// Get prices for a specific product
router.get("/product/:productId/prices", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { variantId, currency = 'USD', customerGroupId, salesChannelId, quantity = 1 } = req.query;

    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const query: any = {
      status: PriceListStatus.ACTIVE,
      'prices.productId': productId,
      'prices.currency': currency
    };

    if (customerGroupId) {
      query.customerGroupIds = { $in: [customerGroupId] };
    }

    if (salesChannelId) {
      query.salesChannelIds = { $in: [salesChannelId] };
    }

    const priceLists = await priceListRepository.find({
      where: query
    });

    // Filter and sort applicable prices
    const applicablePrices: any[] = [];

    priceLists.forEach(priceList => {
      if (priceList.isActive) {
        priceList.prices.forEach(price => {
          if (price.productId === productId && 
              price.currency === currency &&
              (!variantId || !price.variantId || price.variantId === variantId) &&
              (!price.minQuantity || Number(quantity) >= price.minQuantity) &&
              (!price.maxQuantity || Number(quantity) <= price.maxQuantity)) {
            applicablePrices.push({
              ...price,
              priceListId: priceList.id,
              priceListTitle: priceList.title,
              priceListType: priceList.type
            });
          }
        });
      }
    });

    // Sort by amount (lowest first for sales, highest for overrides)
    applicablePrices.sort((a, b) => {
      if (a.priceListType === PriceListType.SALE) {
        return a.amount - b.amount; // Lowest price first for sales
      } else {
        return b.amount - a.amount; // Highest price first for overrides
      }
    });

    res.json({
      productId,
      variantId,
      currency,
      quantity: Number(quantity),
      prices: applicablePrices
    });
  } catch (error) {
    logger.error("Error fetching product prices:", error);
    res.status(500).json({ error: "Failed to fetch product prices" });
  }
});

// Delete price list
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const priceListRepository = AppDataSource.getRepository(PriceList);
    
    const priceList = await priceListRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!priceList) {
      return res.status(404).json({ error: "Price list not found" });
    }

    await priceListRepository.remove(priceList);

    res.json({ message: "Price list deleted successfully" });
  } catch (error) {
    logger.error("Error deleting price list:", error);
    res.status(500).json({ error: "Failed to delete price list" });
  }
});

export default router;
