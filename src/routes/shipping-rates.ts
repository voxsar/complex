import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ShippingRate } from "../entities/ShippingRate";
import { ShippingZone } from "../entities/ShippingZone";
import { ShippingProvider } from "../entities/ShippingProvider";
import { validate } from "class-validator";

const router = Router();

// Get all shipping rates
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      shippingZoneId,
      shippingProviderId,
      isActive,
      sortBy = "priority",
      sortOrder = "desc",
    } = req.query;

    const shippingRateRepository = AppDataSource.getRepository(ShippingRate);
    
    // Build MongoDB query
    const query: any = {};
    
    if (shippingZoneId) {
      query.shippingZoneId = shippingZoneId;
    }
    
    if (shippingProviderId) {
      query.shippingProviderId = shippingProviderId;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [rates, total] = await Promise.all([
      shippingRateRepository.find({
        where: query,
        skip,
        take: limitNum,
        order: sortConfig,
      }),
      shippingRateRepository.count({ where: query }),
    ]);

    res.json({
      rates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching shipping rates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get shipping rate by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingRateRepository = AppDataSource.getRepository(ShippingRate);
    
    const rate = await shippingRateRepository.findOne({
      where: { id },
    });

    if (!rate) {
      return res.status(404).json({ error: "Shipping rate not found" });
    }

    res.json(rate);
  } catch (error) {
    console.error("Error fetching shipping rate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new shipping rate
router.post("/", async (req: Request, res: Response) => {
  try {
    const shippingRateRepository = AppDataSource.getRepository(ShippingRate);
    
    const rate = shippingRateRepository.create(req.body);
    
    // Validate the entity
    const errors = await validate(rate);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const savedRate = await shippingRateRepository.save(rate);
    res.status(201).json(savedRate);
  } catch (error) {
    console.error("Error creating shipping rate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update shipping rate
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingRateRepository = AppDataSource.getRepository(ShippingRate);
    
    const existingRate = await shippingRateRepository.findOne({
      where: { id },
    });

    if (!existingRate) {
      return res.status(404).json({ error: "Shipping rate not found" });
    }

    // Update the rate
    Object.assign(existingRate, req.body);
    existingRate.updatedAt = new Date();

    // Validate the updated entity
    const errors = await validate(existingRate);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const updatedRate = await shippingRateRepository.save(existingRate);
    res.json(updatedRate);
  } catch (error) {
    console.error("Error updating shipping rate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete shipping rate
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingRateRepository = AppDataSource.getRepository(ShippingRate);
    
    const rate = await shippingRateRepository.findOne({
      where: { id },
    });

    if (!rate) {
      return res.status(404).json({ error: "Shipping rate not found" });
    }

    await shippingRateRepository.remove(rate);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting shipping rate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Calculate shipping rates for an order/cart
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const {
      shippingAddress,
      items,
      subtotal,
      weight,
      customerId,
    } = req.body;

    if (!shippingAddress || !items || !subtotal) {
      return res.status(400).json({
        error: "Missing required fields: shippingAddress, items, subtotal"
      });
    }

    const { country, state, city, postalCode } = shippingAddress;

    // First, find applicable shipping zones
    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    const shippingRateRepository = AppDataSource.getRepository(ShippingRate);

    // Find matching zones
    const query: any = {
      isActive: true,
      countries: { $in: [country] },
    };

    if (state) {
      query.$or = [
        { states: { $size: 0 } },
        { states: { $in: [state] } }
      ];
    }

    const zones = await shippingZoneRepository.find({
      where: query,
      order: { priority: "DESC" },
    });

    // Filter zones by city and postal code
    const matchingZones = zones.filter(zone => {
      if (city && zone.cities.length > 0) {
        const cityMatch = zone.cities.some(zoneCity => 
          zoneCity.toLowerCase() === city.toLowerCase()
        );
        if (!cityMatch) return false;
      }

      if (postalCode && zone.postalCodes.length > 0) {
        const postalMatch = zone.postalCodes.some(pattern => {
          return postalCode.startsWith(pattern) || pattern === "*";
        });
        if (!postalMatch) return false;
      }

      return true;
    });

    if (matchingZones.length === 0) {
      return res.json({
        rates: [],
        message: "No shipping available to this location"
      });
    }

    // Get shipping rates for matching zones
    const zoneIds = matchingZones.map(zone => zone.id);
    const availableRates = await shippingRateRepository.find({
      where: {
        shippingZoneId: { $in: zoneIds } as any,
        isActive: true,
      },
      order: { priority: "DESC" },
    });

    // Calculate shipping costs for each rate
    const calculatedRates = [];

    for (const rate of availableRates) {
      let shippingCost = 0;
      let isEligible = true;

      switch (rate.type) {
        case "FLAT_RATE":
          shippingCost = rate.flatRate || 0;
          break;

        case "WEIGHT_BASED":
          if (weight) {
            if (rate.minWeight && weight < rate.minWeight) {
              isEligible = false;
              break;
            }
            if (rate.maxWeight && weight > rate.maxWeight) {
              isEligible = false;
              break;
            }
            shippingCost = (rate.weightRate || 0) * weight;
          } else {
            isEligible = false;
          }
          break;

        case "PRICE_BASED":
          if (rate.minPrice && subtotal < rate.minPrice) {
            isEligible = false;
            break;
          }
          if (rate.maxPrice && subtotal > rate.maxPrice) {
            isEligible = false;
            break;
          }
          shippingCost = subtotal * ((rate.priceRate || 0) / 100);
          break;

        case "FREE":
          if (rate.freeShippingThreshold && subtotal >= rate.freeShippingThreshold) {
            shippingCost = 0;
          } else {
            isEligible = false;
          }
          break;

        case "CALCULATED":
          // For real-time rates from shipping providers
          // This would integrate with UPS, FedEx, etc. APIs
          // For now, we'll skip calculated rates
          isEligible = false;
          break;

        default:
          isEligible = false;
      }

      if (isEligible) {
        // Check for free shipping threshold override
        if (rate.freeShippingThreshold && subtotal >= rate.freeShippingThreshold) {
          shippingCost = 0;
        }

        calculatedRates.push({
          id: rate.id,
          name: rate.name,
          description: rate.description,
          cost: shippingCost,
          estimatedDays: {
            min: rate.minDeliveryDays,
            max: rate.maxDeliveryDays,
          },
          type: rate.type,
          shippingZoneId: rate.shippingZoneId,
          shippingProviderId: rate.shippingProviderId,
        });
      }
    }

    // Sort by cost (cheapest first)
    calculatedRates.sort((a, b) => a.cost - b.cost);

    res.json({
      rates: calculatedRates,
      shippingAddress,
      subtotal,
      weight,
    });
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
