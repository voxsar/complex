import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { OrderClaim } from "../entities/OrderClaim";
import { Order } from "../entities/Order";
import { ClaimStatus } from "../enums/claim_status";
import { ClaimType } from "../enums/claim_type";

const router = Router();

// Get all claims with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      orderId,
      customerId,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const claimRepository = AppDataSource.getRepository(OrderClaim);
    
    const query: any = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (orderId) query.orderId = orderId;
    if (customerId) query.customerId = customerId;

    const [claims, total] = await claimRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { [sortBy as string]: sortOrder === "asc" ? "ASC" : "DESC" }
    });

    res.json({
      claims,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// Get claim by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const claimRepository = AppDataSource.getRepository(OrderClaim);
    
    const claim = await claimRepository.findOne({
      where: { id: id }
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    res.json(claim);
  } catch (error) {
    console.error("Error fetching claim:", error);
    res.status(500).json({ error: "Failed to fetch claim" });
  }
});

// Create new claim
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      customerId,
      type,
      items,
      customerNote,
      attachments = []
    } = req.body;

    const orderRepository = AppDataSource.getRepository(Order);
    const claimRepository = AppDataSource.getRepository(OrderClaim);

    // Verify order exists
    const order = await orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate claim items against order items
    const validItems = items.filter((item: any) => 
      order.items.some(orderItem => orderItem.id === item.orderItemId)
    );

    if (validItems.length === 0) {
      return res.status(400).json({ error: "No valid items found for claim" });
    }

    const claim = new OrderClaim();
    claim.orderId = orderId;
    claim.customerId = customerId;
    claim.type = type;
    claim.status = ClaimStatus.REQUESTED; // Explicitly set the status
    claim.items = validItems.map((item: any) => ({
      id: `clm_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      description: item.description,
      images: item.images || [],
      replacement: item.replacement
    }));
    claim.customerNote = customerNote;
    claim.currency = order.currency;
    claim.attachments = attachments.map((attachment: any) => ({
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ...attachment
    }));

    const savedClaim = await claimRepository.save(claim);

    // Add claim reference to order
    order.claimIds = [...(order.claimIds || []), savedClaim.id];
    await orderRepository.save(order);

    res.status(201).json({
      message: "Claim created successfully",
      claim: savedClaim
    });
  } catch (error) {
    console.error("Error creating claim:", error);
    res.status(500).json({ error: "Failed to create claim" });
  }
});

// Update claim status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote, resolutionNote } = req.body;

    const claimRepository = AppDataSource.getRepository(OrderClaim);
    
    const claim = await claimRepository.findOne({
      where: { id: id }
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    claim.status = status;
    if (adminNote) claim.adminNote = adminNote;
    if (resolutionNote) claim.resolutionNote = resolutionNote;

    // Set timestamps based on status
    if (status === ClaimStatus.RESOLVED) {
      claim.resolvedAt = new Date();
    }

    const updatedClaim = await claimRepository.save(claim);

    res.json({
      message: "Claim status updated successfully",
      claim: updatedClaim
    });
  } catch (error) {
    console.error("Error updating claim status:", error);
    res.status(500).json({ error: "Failed to update claim status" });
  }
});

// Approve claim and create replacement order
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { replacementItems = [], refundAmount = 0, resolutionNote } = req.body;

    const claimRepository = AppDataSource.getRepository(OrderClaim);
    const orderRepository = AppDataSource.getRepository(Order);
    
    const claim = await claimRepository.findOne({
      where: { id: id }
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    if (claim.status !== ClaimStatus.REQUESTED && claim.status !== ClaimStatus.IN_REVIEW) {
      return res.status(400).json({ error: "Claim cannot be approved in current status" });
    }

    // Get the associated order
    const order = await orderRepository.findOne({
      where: { id: claim.orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Associated order not found" });
    }

    // Update claim
    claim.status = ClaimStatus.APPROVED;
    claim.resolutionNote = resolutionNote;
    claim.refundAmount = refundAmount;

    // Update items with replacement information
    claim.items = claim.items.map(item => {
      const replacement = replacementItems.find((r: any) => r.claimItemId === item.id);
      return replacement ? { ...item, replacement } : item;
    });

    // If refund amount is specified, add it to order
    if (refundAmount > 0) {
      order.addRefund(order.payments[0]?.id || 'manual', refundAmount);
      await orderRepository.save(order);
    }

    const updatedClaim = await claimRepository.save(claim);

    res.json({
      message: "Claim approved successfully",
      claim: updatedClaim
    });
  } catch (error) {
    console.error("Error approving claim:", error);
    res.status(500).json({ error: "Failed to approve claim" });
  }
});

// Reject claim
router.post("/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionNote } = req.body;

    const claimRepository = AppDataSource.getRepository(OrderClaim);
    
    const claim = await claimRepository.findOne({
      where: { id: id }
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    claim.status = ClaimStatus.REJECTED;
    claim.resolutionNote = resolutionNote;
    claim.resolvedAt = new Date();

    const updatedClaim = await claimRepository.save(claim);

    res.json({
      message: "Claim rejected successfully",
      claim: updatedClaim
    });
  } catch (error) {
    console.error("Error rejecting claim:", error);
    res.status(500).json({ error: "Failed to reject claim" });
  }
});

// Delete claim
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const claimRepository = AppDataSource.getRepository(OrderClaim);
    
    const claim = await claimRepository.findOne({
      where: { id: id }
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    if (claim.status !== ClaimStatus.REQUESTED) {
      return res.status(400).json({ error: "Only requested claims can be deleted" });
    }

    await claimRepository.remove(claim);

    res.json({ message: "Claim deleted successfully" });
  } catch (error) {
    console.error("Error deleting claim:", error);
    res.status(500).json({ error: "Failed to delete claim" });
  }
});

export default router;
