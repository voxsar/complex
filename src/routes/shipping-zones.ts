import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ShippingZone } from "../entities/ShippingZone";
import { ShippingRate } from "../entities/ShippingRate";
import { validate } from "class-validator";

const router = Router();

// Helper function to create shipping rates
async function createShippingRates(ratesData: any[], shippingZoneId: string): Promise<ShippingRate[]> {
  const rateRepository = AppDataSource.getRepository(ShippingRate);
  const createdRates: ShippingRate[] = [];

  for (const rateData of ratesData) {
    const rate = rateRepository.create({
      ...rateData,
      shippingZoneId: shippingZoneId
    });
    
    const errors = await validate(rate);
    if (errors.length > 0) {
      throw new Error(`Validation failed for shipping rate ${rateData.name}: ${errors.map(e => e.constraints).join(', ')}`);
    }
    
    const savedRates = await rateRepository.save(rate);
    const savedRate = Array.isArray(savedRates) ? savedRates[0] : savedRates;
    createdRates.push(savedRate);
  }

  return createdRates;
}

// Helper function to add shipping rates to existing zone (PATCH)
async function addShippingRates(ratesData: any[], shippingZoneId: string): Promise<ShippingRate[]> {
  const rateRepository = AppDataSource.getRepository(ShippingRate);
  const newRates: ShippingRate[] = [];

  for (const rateData of ratesData) {
    const rate = rateRepository.create({
      ...rateData,
      shippingZoneId: shippingZoneId
    });
    
    const errors = await validate(rate);
    if (errors.length > 0) {
      throw new Error(`Validation failed for shipping rate ${rateData.name}: ${errors.map(e => e.constraints).join(', ')}`);
    }
    
    const savedRates = await rateRepository.save(rate);
    const savedRate = Array.isArray(savedRates) ? savedRates[0] : savedRates;
    newRates.push(savedRate);
  }

  return newRates;
}

// Get all shipping zones
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
      country,
      sortBy = "priority",
      sortOrder = "desc",
    } = req.query;

    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    // Build MongoDB query
    const query: any = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    if (country) {
      query.countries = { $in: [country] };
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [zones, total] = await Promise.all([
      shippingZoneRepository.find({
        where: query,
        skip,
        take: limitNum,
        order: sortConfig,
      }),
      shippingZoneRepository.count({ where: query }),
    ]);

    res.json({
      zones,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error("Error fetching shipping zones:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get shipping zone by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    const zone = await shippingZoneRepository.findOne({
      where: { id },
    });

    if (!zone) {
      return res.status(404).json({ error: "Shipping zone not found" });
    }

    res.json(zone);
  } catch (error) {
    logger.error("Error fetching shipping zone:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new shipping zone
router.post("/", async (req: Request, res: Response) => {
  try {
    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    // Extract shippingRates from request body
    const { shippingRates, ...zoneData } = req.body;
    
    const zone = shippingZoneRepository.create(zoneData);
    
    // Validate the entity
    const errors = await validate(zone);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const savedZones = await shippingZoneRepository.save(zone);
    const savedZone = Array.isArray(savedZones) ? savedZones[0] : savedZones;
    
    // Create shipping rates if provided
    let createdRates: ShippingRate[] = [];
    if (shippingRates && Array.isArray(shippingRates) && shippingRates.length > 0) {
      try {
        createdRates = await createShippingRates(shippingRates, savedZone.id);
        logger.info(`✅ Created ${createdRates.length} shipping rates for zone ${savedZone.id}`);
      } catch (rateError) {
        logger.error("Error creating shipping rates:", rateError);
        return res.status(400).json({ 
          error: "Failed to create shipping rates", 
          details: rateError.message 
        });
      }
    }

    // Return zone with rates
    const response = {
      ...savedZone,
      shippingRates: createdRates
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error("Error creating shipping zone:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update shipping zone
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    const existingZone = await shippingZoneRepository.findOne({
      where: { id },
    });

    if (!existingZone) {
      return res.status(404).json({ error: "Shipping zone not found" });
    }

    // Extract shippingRates from request body
    const { shippingRates, ...zoneData } = req.body;

    // Update the zone
    Object.assign(existingZone, zoneData);
    existingZone.updatedAt = new Date();

    // Validate the updated entity
    const errors = await validate(existingZone);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const updatedZones = await shippingZoneRepository.save(existingZone);
    const updatedZone = Array.isArray(updatedZones) ? updatedZones[0] : updatedZones;
    
    // Replace shipping rates if provided
    let resultRates: ShippingRate[] = [];
    if (shippingRates && Array.isArray(shippingRates) && shippingRates.length > 0) {
      try {
        // Note: For PUT, we could optionally delete existing rates first
        resultRates = await createShippingRates(shippingRates, updatedZone.id);
        logger.info(`✅ Updated ${resultRates.length} shipping rates for zone ${updatedZone.id}`);
      } catch (rateError) {
        logger.error("Error updating shipping rates:", rateError);
        return res.status(400).json({ 
          error: "Failed to update shipping rates", 
          details: rateError.message 
        });
      }
    }

    // Return zone with rates
    const response = {
      ...updatedZone,
      shippingRates: resultRates
    };

    res.json(response);
    res.json(updatedZone);
  } catch (error) {
    logger.error("Error updating shipping zone:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete shipping zone
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    const zone = await shippingZoneRepository.findOne({
      where: { id },
    });

    if (!zone) {
      return res.status(404).json({ error: "Shipping zone not found" });
    }

    await shippingZoneRepository.remove(zone);
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting shipping zone:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if an address is covered by shipping zones
router.post("/check-coverage", async (req: Request, res: Response) => {
  try {
    const { country, state, city, postalCode } = req.body;
    
    if (!country) {
      return res.status(400).json({ error: "Country is required" });
    }

    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    // Find matching zones
    const query: any = {
      isActive: true,
      countries: { $in: [country] },
    };

    // Add state filter if provided and zone has states configured
    if (state) {
      query.$or = [
        { states: { $size: 0 } }, // Empty states array means all states
        { states: { $in: [state] } }
      ];
    }

    const zones = await shippingZoneRepository.find({
      where: query,
      order: { priority: "DESC" },
    });

    // Further filter by city and postal code if specified
    const matchingZones = zones.filter(zone => {
      // Check city
      if (city && zone.cities.length > 0) {
        const cityMatch = zone.cities.some(zoneCity => 
          zoneCity.toLowerCase() === city.toLowerCase()
        );
        if (!cityMatch) return false;
      }

      // Check postal code patterns
      if (postalCode && zone.postalCodes.length > 0) {
        const postalMatch = zone.postalCodes.some(pattern => {
          // Simple pattern matching - can be enhanced with regex
          return postalCode.startsWith(pattern) || pattern === "*";
        });
        if (!postalMatch) return false;
      }

      return true;
    });

    res.json({
      covered: matchingZones.length > 0,
      zones: matchingZones,
    });
  } catch (error) {
    logger.error("Error checking shipping coverage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Partial update shipping zone (PATCH)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    const existingZone = await shippingZoneRepository.findOne({
      where: { id },
    });

    if (!existingZone) {
      return res.status(404).json({ error: "Shipping zone not found" });
    }

    // Extract shippingRates from request body
    const { shippingRates, ...zoneData } = req.body;

    // Update only provided zone fields
    Object.assign(existingZone, zoneData);
    existingZone.updatedAt = new Date();
    
    // Validate zone if any fields were updated
    if (Object.keys(zoneData).length > 0) {
      const errors = await validate(existingZone);
      if (errors.length > 0) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.map(err => ({
            property: err.property,
            constraints: err.constraints
          }))
        });
      }
      
      await shippingZoneRepository.save(existingZone);
    }
    
    // Add new shipping rates if provided (don't replace existing ones)
    let addedRates: ShippingRate[] = [];
    if (shippingRates && Array.isArray(shippingRates) && shippingRates.length > 0) {
      try {
        addedRates = await addShippingRates(shippingRates, existingZone.id);
        logger.info(`✅ Added ${addedRates.length} new shipping rates to zone ${existingZone.id}`);
      } catch (rateError) {
        logger.error("Error adding shipping rates:", rateError);
        return res.status(400).json({ 
          error: "Failed to add shipping rates", 
          details: rateError.message 
        });
      }
    }

    // Return zone with newly added rates
    const response = {
      ...existingZone,
      addedShippingRates: addedRates
    };

    res.json(response);
  } catch (error) {
    logger.error("Error patching shipping zone:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
