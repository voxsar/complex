import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { TaxRegion } from "../entities/TaxRegion";
import { TaxRegionStatus } from "../enums/tax_region_status";
import { TaxTargetType } from "../enums/tax_target_type";
import { validate } from "class-validator";

const router = Router();

// Get all tax regions with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      countryCode,
      parentRegionId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const query: any = {};
    
    if (status) query.status = status;
    if (countryCode) query.countryCode = countryCode;
    if (parentRegionId) {
      query.parentRegionId = parentRegionId === "null" ? null : parentRegionId;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { countryCode: { $regex: search, $options: 'i' } },
        { subdivisionCode: { $regex: search, $options: 'i' } }
      ];
    }

    const [taxRegions, total] = await taxRegionRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { [sortBy as string]: sortOrder === "asc" ? "ASC" : "DESC" }
    });

    res.json({
      taxRegions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching tax regions:", error);
    res.status(500).json({ error: "Failed to fetch tax regions" });
  }
});

// Get tax region by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    // Get subregions if this region supports them
    let subregions = [];
    if (taxRegion.sublevelEnabled) {
      subregions = await taxRegionRepository.find({
        where: { parentRegionId: taxRegion.id }
      });
    }

    res.json({
      ...taxRegion,
      subregions
    });
  } catch (error) {
    console.error("Error fetching tax region:", error);
    res.status(500).json({ error: "Failed to fetch tax region" });
  }
});

// Create new tax region
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      name,
      countryCode,
      subdivisionCode,
      status = TaxRegionStatus.ACTIVE,
      parentRegionId,
      isDefault = false,
      sublevelEnabled = false,
      defaultTaxRateName,
      defaultTaxRate,
      defaultTaxCode,
      defaultCombinableWithParent = false
    } = req.body;

    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);

    // Check if a default region already exists for this country (for top-level regions)
    if (isDefault && !parentRegionId) {
      const existingDefault = await taxRegionRepository.findOne({
        where: { 
          countryCode, 
          isDefault: true,
          parentRegionId: null
        }
      });

      if (existingDefault) {
        return res.status(400).json({ 
          error: "A default tax region already exists for this country" 
        });
      }
    }

    const taxRegion = new TaxRegion();
    taxRegion.name = name;
    taxRegion.countryCode = countryCode.toUpperCase();
    if (subdivisionCode) taxRegion.subdivisionCode = subdivisionCode.toUpperCase();
    taxRegion.status = status;
    if (parentRegionId) taxRegion.parentRegionId = parentRegionId;
    taxRegion.isDefault = isDefault;
    taxRegion.sublevelEnabled = sublevelEnabled;
    
    if (defaultTaxRateName) taxRegion.defaultTaxRateName = defaultTaxRateName;
    if (defaultTaxRate !== undefined) taxRegion.defaultTaxRate = defaultTaxRate;
    if (defaultTaxCode) taxRegion.defaultTaxCode = defaultTaxCode;
    taxRegion.defaultCombinableWithParent = defaultCombinableWithParent;

    // Validate
    const errors = await validate(taxRegion);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedTaxRegion = await taxRegionRepository.save(taxRegion);

    res.status(201).json({
      message: "Tax region created successfully",
      taxRegion: savedTaxRegion
    });
  } catch (error) {
    console.error("Error creating tax region:", error);
    res.status(500).json({ error: "Failed to create tax region" });
  }
});

// Update tax region
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      status,
      isDefault,
      sublevelEnabled,
      defaultTaxRateName,
      defaultTaxRate,
      defaultTaxCode,
      defaultCombinableWithParent
    } = req.body;

    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    // Check default region constraint
    if (isDefault && !taxRegion.isDefault && !taxRegion.parentRegionId) {
      const existingDefault = await taxRegionRepository
        .createQueryBuilder("region")
        .where("region.countryCode = :countryCode", { countryCode: taxRegion.countryCode })
        .andWhere("region.isDefault = :isDefault", { isDefault: true })
        .andWhere("region.parentRegionId IS NULL")
        .andWhere("region._id != :id", { id: new ObjectId(id) })
        .getOne();

      if (existingDefault) {
        return res.status(400).json({ 
          error: "A default tax region already exists for this country" 
        });
      }
    }

    // Update fields
    if (name !== undefined) taxRegion.name = name;
    if (status !== undefined) taxRegion.status = status;
    if (isDefault !== undefined) taxRegion.isDefault = isDefault;
    if (sublevelEnabled !== undefined) taxRegion.sublevelEnabled = sublevelEnabled;
    if (defaultTaxRateName !== undefined) taxRegion.defaultTaxRateName = defaultTaxRateName;
    if (defaultTaxRate !== undefined) taxRegion.defaultTaxRate = defaultTaxRate;
    if (defaultTaxCode !== undefined) taxRegion.defaultTaxCode = defaultTaxCode;
    if (defaultCombinableWithParent !== undefined) taxRegion.defaultCombinableWithParent = defaultCombinableWithParent;

    const updatedTaxRegion = await taxRegionRepository.save(taxRegion);

    res.json({
      message: "Tax region updated successfully",
      taxRegion: updatedTaxRegion
    });
  } catch (error) {
    console.error("Error updating tax region:", error);
    res.status(500).json({ error: "Failed to update tax region" });
  }
});

// Create tax rate override
router.post("/:id/overrides", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, rate, code, combinable = false, targets } = req.body;

    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    const newOverride = taxRegion.addTaxOverride({
      name,
      rate,
      code,
      combinable,
      targets
    });

    const updatedTaxRegion = await taxRegionRepository.save(taxRegion);

    res.status(201).json({
      message: "Tax rate override created successfully",
      taxRegion: updatedTaxRegion,
      override: newOverride
    });
  } catch (error) {
    console.error("Error creating tax rate override:", error);
    res.status(500).json({ error: "Failed to create tax rate override" });
  }
});

// Update tax rate override
router.put("/:id/overrides/:overrideId", async (req: Request, res: Response) => {
  try {
    const { id, overrideId } = req.params;
    const { name, rate, code, combinable, targets } = req.body;

    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    const updatedOverride = taxRegion.updateTaxOverride(overrideId, {
      ...(name !== undefined && { name }),
      ...(rate !== undefined && { rate }),
      ...(code !== undefined && { code }),
      ...(combinable !== undefined && { combinable }),
      ...(targets !== undefined && { targets })
    });

    if (!updatedOverride) {
      return res.status(404).json({ error: "Tax rate override not found" });
    }

    const updatedTaxRegion = await taxRegionRepository.save(taxRegion);

    res.json({
      message: "Tax rate override updated successfully",
      taxRegion: updatedTaxRegion,
      override: updatedOverride
    });
  } catch (error) {
    console.error("Error updating tax rate override:", error);
    res.status(500).json({ error: "Failed to update tax rate override" });
  }
});

// Delete tax rate override
router.delete("/:id/overrides/:overrideId", async (req: Request, res: Response) => {
  try {
    const { id, overrideId } = req.params;

    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    const removed = taxRegion.removeTaxOverride(overrideId);

    if (!removed) {
      return res.status(404).json({ error: "Tax rate override not found" });
    }

    const updatedTaxRegion = await taxRegionRepository.save(taxRegion);

    res.json({
      message: "Tax rate override deleted successfully",
      taxRegion: updatedTaxRegion
    });
  } catch (error) {
    console.error("Error deleting tax rate override:", error);
    res.status(500).json({ error: "Failed to delete tax rate override" });
  }
});

// Get subregions of a tax region
router.get("/:id/subregions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);

    // First verify the parent region exists
    const parentRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!parentRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    const subregions = await taxRegionRepository.find({
      where: { parentRegionId: parentRegion.id },
      order: { name: "ASC" }
    });

    res.json({
      parentRegion: {
        id: parentRegion.id,
        name: parentRegion.name,
        countryCode: parentRegion.countryCode
      },
      subregions
    });
  } catch (error) {
    console.error("Error fetching subregions:", error);
    res.status(500).json({ error: "Failed to fetch subregions" });
  }
});

// Enable sublevel regions for a tax region
router.post("/:id/enable-sublevels", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    if (taxRegion.parentRegionId) {
      return res.status(400).json({ error: "Cannot enable sublevels for a subregion" });
    }

    taxRegion.sublevelEnabled = true;
    const updatedTaxRegion = await taxRegionRepository.save(taxRegion);

    res.json({
      message: "Sublevels enabled successfully",
      taxRegion: updatedTaxRegion
    });
  } catch (error) {
    console.error("Error enabling sublevels:", error);
    res.status(500).json({ error: "Failed to enable sublevels" });
  }
});

// Get tax calculation for a product in a region
router.post("/:id/calculate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId, productType, amount } = req.body;

    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    const taxRate = taxRegion.getTaxRateForProduct(productId, productType);
    const taxAmount = amount * taxRate;

    res.json({
      regionId: taxRegion.id,
      regionName: taxRegion.name,
      productId,
      productType,
      amount,
      taxRate,
      taxRatePercentage: taxRate * 100,
      taxAmount,
      totalAmount: amount + taxAmount
    });
  } catch (error) {
    console.error("Error calculating tax:", error);
    res.status(500).json({ error: "Failed to calculate tax" });
  }
});

// Delete tax region
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taxRegionRepository = AppDataSource.getRepository(TaxRegion);
    
    const taxRegion = await taxRegionRepository.findOne({
      where: { _id: new ObjectId(id) }
    });

    if (!taxRegion) {
      return res.status(404).json({ error: "Tax region not found" });
    }

    // Check if there are subregions
    const subregions = await taxRegionRepository.find({
      where: { parentRegionId: taxRegion.id }
    });

    if (subregions.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete tax region with subregions. Delete subregions first." 
      });
    }

    await taxRegionRepository.remove(taxRegion);

    res.json({ message: "Tax region deleted successfully" });
  } catch (error) {
    console.error("Error deleting tax region:", error);
    res.status(500).json({ error: "Failed to delete tax region" });
  }
});

export default router;
