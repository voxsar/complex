import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Campaign } from "../entities/Campaign";
import { CampaignStatus } from "../enums/campaign_status";
import { validate } from "class-validator";

const router = Router();

// Get all campaigns
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const campaignRepository = AppDataSource.getRepository(Campaign);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get campaigns
    const [campaigns, total] = await Promise.all([
      campaignRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      campaignRepository.count({ where: query })
    ]);

    res.json({
      campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// Get campaign by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaignRepository = AppDataSource.getRepository(Campaign);

    const campaign = await campaignRepository.findOne({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json(campaign);
  } catch (error) {
    logger.error("Error fetching campaign:", error);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// Create campaign
router.post("/", async (req: Request, res: Response) => {
  try {
    const campaignRepository = AppDataSource.getRepository(Campaign);
    
    const campaign = campaignRepository.create(req.body);
    
    // Validate
    const errors = await validate(campaign);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedCampaign = await campaignRepository.save(campaign);
    res.status(201).json(savedCampaign);
  } catch (error) {
    logger.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// Update campaign
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaignRepository = AppDataSource.getRepository(Campaign);

    const campaign = await campaignRepository.findOne({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Update fields
    Object.assign(campaign, req.body);
    
    // Validate
    const errors = await validate(campaign);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedCampaign = await campaignRepository.save(campaign);
    res.json(updatedCampaign);
  } catch (error) {
    logger.error("Error updating campaign:", error);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// Start campaign
router.post("/:id/start", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaignRepository = AppDataSource.getRepository(Campaign);

    const campaign = await campaignRepository.findOne({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.status = CampaignStatus.RUNNING;
    campaign.startedAt = new Date();

    const updatedCampaign = await campaignRepository.save(campaign);
    res.json(updatedCampaign);
  } catch (error) {
    logger.error("Error starting campaign:", error);
    res.status(500).json({ error: "Failed to start campaign" });
  }
});

// Pause campaign
router.post("/:id/pause", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaignRepository = AppDataSource.getRepository(Campaign);

    const campaign = await campaignRepository.findOne({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.status = CampaignStatus.PAUSED;

    const updatedCampaign = await campaignRepository.save(campaign);
    res.json(updatedCampaign);
  } catch (error) {
    logger.error("Error pausing campaign:", error);
    res.status(500).json({ error: "Failed to pause campaign" });
  }
});

// Get campaign analytics
router.get("/:id/analytics", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaignRepository = AppDataSource.getRepository(Campaign);

    const campaign = await campaignRepository.findOne({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const analytics = {
      deliveryRate: campaign.deliveryRate,
      openRate: campaign.openRate,
      clickRate: campaign.clickRate,
      conversionRate: campaign.conversionRate,
      bounceRate: campaign.bounceRate,
      unsubscribeRate: campaign.unsubscribeRate,
      totalSent: campaign.totalSent,
      totalDelivered: campaign.totalDelivered,
      totalOpened: campaign.totalOpened,
      totalClicked: campaign.totalClicked,
      totalConverted: campaign.totalConverted,
    };

    res.json(analytics);
  } catch (error) {
    logger.error("Error fetching campaign analytics:", error);
    res.status(500).json({ error: "Failed to fetch campaign analytics" });
  }
});

export default router;
