import { Router, Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { validate } from "class-validator";
import { translateCategory } from "../utils/translation";
import logger from "../utils/logger";

const router = Router();

const formatCategory = (category: Category, locale: string) => ({
  ...translateCategory(category, locale),
  visibility: category.metadata?.visibility,
});

// Get all categories
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      active,
      parentId,
      search,
      sortBy = "sortOrder",
      sortOrder = "asc",
    } = req.query;

    const locale = (req.query.locale as string) || req.language;

    const categoryRepository = AppDataSource.getRepository(Category);

    // Build MongoDB query
    const query: any = {};

    if (active !== undefined) {
      query.isActive = active === "true";
    }

    if (parentId !== undefined) {
      query.parentId = parentId === "null" ? null : parentId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get categories
    const [categories, total] = await Promise.all([
      categoryRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      categoryRepository.count({ where: query })
    ]);

    res.json({
      categories: categories.map(c => formatCategory(c, locale)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching categories:", error);
    res.status(500).json({ error: req.t("errors.failed_to_fetch_categories") });
  }
});

// Get category by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const locale = (req.query.locale as string) || req.language;
    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ error: req.t("errors.category_not_found") });
    }

    res.json(formatCategory(category, locale));
  } catch (error) {
    logger.error("Error fetching category:", error);
    res.status(500).json({ error: req.t("errors.failed_to_fetch_category") });
  }
});

// Get category by slug
router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const locale = (req.query.locale as string) || req.language;
    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { slug }
    });

    if (!category) {
      return res.status(404).json({ error: req.t("errors.category_not_found") });
    }

    res.json(formatCategory(category, locale));
  } catch (error) {
    logger.error("Error fetching category:", error);
    res.status(500).json({ error: req.t("errors.failed_to_fetch_category") });
  }
});

// Create category
  router.post("/", async (req: Request, res: Response) => {
  try {
    const categoryRepository = AppDataSource.getRepository(Category);

    logger.debug("Incoming category payload:", req.body);
    const category = categoryRepository.create(req.body);


    // Validate
    const errors = await validate(category);
    if (errors.length > 0) {
      logger.warn("Category validation errors:", errors);

      return res.status(400).json({ errors });
    }

    // Check if slug already exists
    const existingCategory = await categoryRepository.findOne({
      where: { slug: category.slug }
    });

    if (existingCategory) {
      return res.status(409).json({ error: req.t("errors.category_slug_exists") });
    }

    const savedCategories = await categoryRepository.save(category);
    const savedCategory = Array.isArray(savedCategories) ? savedCategories[0] : savedCategories;
    logger.info(`Category created with ID: ${savedCategory.id}`);

    // Update parent category if needed
    if (savedCategory.parentId) {
      const parentCategory = await categoryRepository.findOne({
        where: { id: savedCategory.parentId }
      });

      if (parentCategory) {
        if (!parentCategory.childrenIds) {
          parentCategory.childrenIds = [];
        }
        if (!parentCategory.childrenIds.includes(savedCategory.id)) {
          parentCategory.childrenIds.push(savedCategory.id);
          await categoryRepository.save(parentCategory);
        }
      }
    }


    logger.info(`Category created with ID: ${savedCategory.id}`);
    res.status(201).json(savedCategory);
  } catch (error) {
    logger.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update category
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ error: req.t("errors.category_not_found") });
    }

    const oldParentId = category.parentId;
    
    // Update fields
    Object.assign(category, req.body);
    
    // Validate
    const errors = await validate(category);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedCategory = await categoryRepository.save(category);
    
    // Handle parent changes
    if (oldParentId !== category.parentId) {
      // Remove from old parent
      if (oldParentId) {
        const oldParent = await categoryRepository.findOne({
          where: { id: oldParentId }
        });
        if (oldParent && oldParent.childrenIds) {
          oldParent.childrenIds = oldParent.childrenIds.filter(childId => childId !== id);
          await categoryRepository.save(oldParent);
        }
      }
      
      // Add to new parent
      if (category.parentId) {
        const newParent = await categoryRepository.findOne({
          where: { id: category.parentId }
        });
        if (newParent) {
          if (!newParent.childrenIds) {
            newParent.childrenIds = [];
          }
          if (!newParent.childrenIds.includes(id)) {
            newParent.childrenIds.push(id);
            await categoryRepository.save(newParent);
          }
        }
      }
    }

    res.json({
      ...updatedCategory,
      visibility: updatedCategory.metadata?.visibility,
    });
  } catch (error) {
    logger.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ error: req.t("errors.category_not_found") });
    }

    // Check if category has children
    if (category.childrenIds && category.childrenIds.length > 0) {
      return res.status(400).json({
        error: req.t("errors.cannot_delete_category_with_children"),
      });
    }

    // Remove from parent
    if (category.parentId) {
      const parent = await categoryRepository.findOne({
        where: { id: category.parentId }
      });
      if (parent && parent.childrenIds) {
        parent.childrenIds = parent.childrenIds.filter(childId => childId !== id);
        await categoryRepository.save(parent);
      }
    }

    await categoryRepository.delete({ id });
    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Get category children
router.get("/:id/children", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const locale = (req.query.locale as string) || req.language;
    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ error: req.t("errors.category_not_found") });
    }

    if (!category.childrenIds || category.childrenIds.length === 0) {
      return res.json([]);
    }

    const children = await categoryRepository.find({
      where: { id: In(category.childrenIds) },
      order: { sortOrder: "ASC" }
    });

    res.json(children.map(c => formatCategory(c, locale)));
  } catch (error) {
    logger.error("Error fetching category children:", error);
    res.status(500).json({ error: "Failed to fetch category children" });
  }
});

export default router;
