import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ShippingZone } from "../entities/ShippingZone";
import { validate } from "class-validator";

const router = Router();

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
    console.error("Error fetching shipping zones:", error);
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
    console.error("Error fetching shipping zone:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new shipping zone
router.post("/", async (req: Request, res: Response) => {
  try {
    const shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    
    const zone = shippingZoneRepository.create(req.body);
    
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

    const savedZone = await shippingZoneRepository.save(zone);
    res.status(201).json(savedZone);
  } catch (error) {
    console.error("Error creating shipping zone:", error);
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

    // Update the zone
    Object.assign(existingZone, req.body);
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

    const updatedZone = await shippingZoneRepository.save(existingZone);
    res.json(updatedZone);
  } catch (error) {
    console.error("Error updating shipping zone:", error);
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
    console.error("Error deleting shipping zone:", error);
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
    console.error("Error checking shipping coverage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
