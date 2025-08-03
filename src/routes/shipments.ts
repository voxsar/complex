import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Shipment } from "../entities/Shipment";
import { ShipmentStatus } from "../enums/shipment_status";
import { validate } from "class-validator";

const router = Router();

// Get all shipments
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      orderId,
      trackingNumber,
      shippingProviderId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (orderId) {
      query.orderId = orderId;
    }
    
    if (trackingNumber) {
      query.trackingNumber = trackingNumber;
    }
    
    if (shippingProviderId) {
      query.shippingProviderId = shippingProviderId;
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [shipments, total] = await Promise.all([
      shipmentRepository.find({
        where: query,
        skip,
        take: limitNum,
        order: sortConfig,
      }),
      shipmentRepository.count({ where: query }),
    ]);

    res.json({
      shipments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get shipment by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    const shipment = await shipmentRepository.findOne({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    res.json(shipment);
  } catch (error) {
    console.error("Error fetching shipment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new shipment
router.post("/", async (req: Request, res: Response) => {
  try {
    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    const shipment = shipmentRepository.create(req.body);
    
    // Validate the entity
    const errors = await validate(shipment);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const savedShipment = await shipmentRepository.save(shipment);
    res.status(201).json(savedShipment);
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update shipment
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    const existingShipment = await shipmentRepository.findOne({
      where: { id },
    });

    if (!existingShipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Update the shipment
    Object.assign(existingShipment, req.body);
    existingShipment.updatedAt = new Date();

    // Validate the updated entity
    const errors = await validate(existingShipment);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const updatedShipment = await shipmentRepository.save(existingShipment);
    res.json(updatedShipment);
  } catch (error) {
    console.error("Error updating shipment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update shipment status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, trackingEvents } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    const shipment = await shipmentRepository.findOne({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Update status
    shipment.status = status;
    shipment.updatedAt = new Date();

    // Add tracking events if provided
    if (trackingEvents && Array.isArray(trackingEvents)) {
      shipment.trackingEvents = [...shipment.trackingEvents, ...trackingEvents];
    }

    // Update status-specific timestamps
    if (status === "SHIPPED" && !shipment.shippedAt) {
      shipment.shippedAt = new Date();
    } else if (status === "DELIVERED" && !shipment.deliveredAt) {
      shipment.deliveredAt = new Date();
      shipment.actualDeliveryDate = new Date();
    }

    const updatedShipment = await shipmentRepository.save(shipment);
    res.json(updatedShipment);
  } catch (error) {
    console.error("Error updating shipment status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Track shipment
router.get("/:id/track", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    const shipment = await shipmentRepository.findOne({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // In a real implementation, this would fetch real-time tracking data
    // from the shipping provider's API using the tracking number
    
    res.json({
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        serviceType: shipment.serviceType,
        estimatedDeliveryDate: shipment.estimatedDeliveryDate,
        actualDeliveryDate: shipment.actualDeliveryDate,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
      },
      trackingEvents: shipment.trackingEvents,
      toAddress: shipment.toAddress,
      packages: shipment.packages.map(pkg => ({
        id: pkg.id,
        weight: pkg.weight,
        dimensions: {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
          units: pkg.units,
        },
        itemCount: pkg.items.length,
      })),
    });
  } catch (error) {
    console.error("Error tracking shipment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate shipping label
router.post("/:id/generate-label", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = "PDF" } = req.body;

    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    const shipment = await shipmentRepository.findOne({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    if (shipment.labelUrl) {
      return res.json({
        labelUrl: shipment.labelUrl,
        format: shipment.labelFormat,
        message: "Label already generated",
      });
    }

    // In a real implementation, this would generate a label via shipping provider API
    const mockLabelUrl = `https://api.shipping-provider.com/labels/${shipment.trackingNumber}.${format.toLowerCase()}`;
    
    // Update shipment with label info
    shipment.labelUrl = mockLabelUrl;
    shipment.labelFormat = format;
    shipment.updatedAt = new Date();

    await shipmentRepository.save(shipment);

    res.json({
      labelUrl: mockLabelUrl,
      format,
      message: "Label generated successfully",
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
    });
  } catch (error) {
    console.error("Error generating shipping label:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel shipment
router.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const shipmentRepository = AppDataSource.getRepository(Shipment);
    
    const shipment = await shipmentRepository.findOne({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    if (shipment.status === "DELIVERED") {
      return res.status(400).json({ error: "Cannot cancel delivered shipment" });
    }

    if (shipment.status === "CANCELLED") {
      return res.status(400).json({ error: "Shipment already cancelled" });
    }

    // Update shipment status
    shipment.status = ShipmentStatus.CANCELLED;
    shipment.updatedAt = new Date();

    // Add cancellation tracking event
    shipment.trackingEvents.push({
      status: "CANCELLED",
      description: reason || "Shipment cancelled",
      timestamp: new Date(),
    });

    const updatedShipment = await shipmentRepository.save(shipment);
    res.json(updatedShipment);
  } catch (error) {
    console.error("Error cancelling shipment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
