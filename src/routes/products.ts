import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/Product";
import { ProductStatus } from "../enums/product_status";
import { validate } from "class-validator";

const router = Router();

// Get all products with filters and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      featured,
      visible,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const productRepository = AppDataSource.getRepository(Product);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (featured !== undefined) {
      query.isFeatured = featured === "true";
    }
    
    if (visible !== undefined) {
      query.isVisible = visible === "true";
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get products
    const [products, total] = await Promise.all([
      productRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      productRepository.count({ where: query })
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create product
router.post("/", async (req: Request, res: Response) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    
    const product = productRepository.create(req.body);
    
    // Validate
    const errors = await validate(product);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedProduct = await productRepository.save(product);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update fields
    Object.assign(product, req.body);
    
    // Validate
    const errors = await validate(product);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedProduct = await productRepository.save(product);
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const result = await productRepository.delete({ id });

    if (result.affected === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Get product variants
router.get("/:id/variants", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product.variants || []);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ error: "Failed to fetch product variants" });
  }
});

// Add product variant
router.post("/:id/variants", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variant = {
      id: require("uuid").v4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!product.variants) {
      product.variants = [];
    }
    
    product.variants.push(variant);
    
    const updatedProduct = await productRepository.save(product);
    res.status(201).json(variant);
  } catch (error) {
    console.error("Error adding product variant:", error);
    res.status(500).json({ error: "Failed to add product variant" });
  }
});

// Update product variant
router.put("/:id/variants/:variantId", async (req: Request, res: Response) => {
  try {
    const { id, variantId } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variantIndex = product.variants?.findIndex(v => v.id === variantId);
    
    if (variantIndex === -1 || variantIndex === undefined) {
      return res.status(404).json({ error: "Variant not found" });
    }

    // Update variant
    product.variants![variantIndex] = {
      ...product.variants![variantIndex],
      ...req.body,
      updatedAt: new Date()
    };

    const updatedProduct = await productRepository.save(product);
    res.json(product.variants![variantIndex]);
  } catch (error) {
    console.error("Error updating product variant:", error);
    res.status(500).json({ error: "Failed to update product variant" });
  }
});

// Delete product variant
router.delete("/:id/variants/:variantId", async (req: Request, res: Response) => {
  try {
    const { id, variantId } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!product.variants) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const initialLength = product.variants.length;
    product.variants = product.variants.filter(v => v.id !== variantId);

    if (product.variants.length === initialLength) {
      return res.status(404).json({ error: "Variant not found" });
    }

    await productRepository.save(product);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product variant:", error);
    res.status(500).json({ error: "Failed to delete product variant" });
  }
});

export default router;
