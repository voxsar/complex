import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/Product";
import { ProductOption } from "../entities/ProductOption";
import { ProductStatus } from "../enums/product_status";
import { validate } from "class-validator";

const router = Router();

// Helper function to create product options
async function createProductOptions(optionsData: any[], productId: string): Promise<ProductOption[]> {
  const optionRepository = AppDataSource.getRepository(ProductOption);
  const createdOptions: ProductOption[] = [];

  for (const optionData of optionsData) {
    const option = optionRepository.create({
      ...optionData,
      productIds: [productId] // Associate with the product
    });
    
    const errors = await validate(option);
    if (errors.length > 0) {
      throw new Error(`Validation failed for option ${optionData.name}: ${errors.map(e => e.constraints).join(', ')}`);
    }
    
    const savedOption = await optionRepository.save(option);
    createdOptions.push(savedOption);
  }

  return createdOptions;
}

// Helper function to update existing product options or create new ones
async function updateProductOptions(optionsData: any[], productId: string, existingOptionIds: string[] = []): Promise<ProductOption[]> {
  const optionRepository = AppDataSource.getRepository(ProductOption);
  const resultOptions: ProductOption[] = [];

  for (const optionData of optionsData) {
    let option: ProductOption;

    if (optionData.id && existingOptionIds.includes(optionData.id)) {
      // Update existing option
      option = await optionRepository.findOne({ where: { id: optionData.id } });
      if (option) {
        Object.assign(option, optionData);
        // Ensure product is still associated
        if (!option.productIds.includes(productId)) {
          option.productIds.push(productId);
        }
      } else {
        throw new Error(`Product option with ID ${optionData.id} not found`);
      }
    } else {
      // Create new option
      option = optionRepository.create({
        ...optionData,
        productIds: [productId]
      });
    }

    const errors = await validate(option);
    if (errors.length > 0) {
      throw new Error(`Validation failed for option ${optionData.name}: ${errors.map(e => e.constraints).join(', ')}`);
    }

    const savedOption = await optionRepository.save(option);
    resultOptions.push(savedOption);
  }

  return resultOptions;
}

// Helper function to add options to existing product (PATCH)
async function addProductOptions(optionsData: any[], productId: string, existingOptionIds: string[] = []): Promise<ProductOption[]> {
  const optionRepository = AppDataSource.getRepository(ProductOption);
  const newOptions: ProductOption[] = [];

  for (const optionData of optionsData) {
    // Only create new options for PATCH
    const option = optionRepository.create({
      ...optionData,
      productIds: [productId]
    });
    
    const errors = await validate(option);
    if (errors.length > 0) {
      throw new Error(`Validation failed for option ${optionData.name}: ${errors.map(e => e.constraints).join(', ')}`);
    }
    
    const savedOption = await optionRepository.save(option);
    newOptions.push(savedOption);
  }

  return newOptions;
}

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

// Search products using MongoDB text index
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter q is required" });
    }

    const productRepository = AppDataSource.getMongoRepository(Product);

    // Ensure text index exists on relevant fields
    await productRepository.createCollectionIndex({
      title: "text",
      description: "text",
      tags: "text",
    });

    const skip = (Number(page) - 1) * Number(limit);

    const pipeline = [
      { $match: { $text: { $search: q as string } } },
      { $addFields: { score: { $meta: "textScore" } } },
      { $sort: { score: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const cursor = productRepository.aggregate(pipeline);
    const products = await cursor.toArray();

    const total = await productRepository.count({
      $text: { $search: q as string },
    });

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
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
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
    
    // Extract productOptions from request body
    const { productOptions, ...productData } = req.body;
    
    const product = productRepository.create(productData);
    
    // Validate product
    const errors = await validate(product);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedProducts = await productRepository.save(product);
    const savedProduct = Array.isArray(savedProducts) ? savedProducts[0] : savedProducts;
    
    // Create product options if provided
    let createdOptions: ProductOption[] = [];
    if (productOptions && Array.isArray(productOptions) && productOptions.length > 0) {
      try {
        createdOptions = await createProductOptions(productOptions, savedProduct.id);
        
        // Update product with option IDs
        savedProduct.optionIds = createdOptions.map(opt => opt.id);
        await productRepository.save(savedProduct);
        
        console.log(`✅ Created ${createdOptions.length} product options for product ${savedProduct.id}`);
      } catch (optionError) {
        console.error("Error creating product options:", optionError);
        return res.status(400).json({ 
          error: "Failed to create product options", 
          details: optionError.message 
        });
      }
    }

    // Return product with options
    const response = {
      ...savedProduct,
      productOptions: createdOptions
    };

    res.status(201).json(response);
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

    // Extract productOptions from request body
    const { productOptions, ...productData } = req.body;

    // Update product fields
    Object.assign(product, productData);
    
    // Validate product
    const errors = await validate(product);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedProducts = await productRepository.save(product);
    const updatedProduct = Array.isArray(updatedProducts) ? updatedProducts[0] : updatedProducts;
    
    // Update product options if provided
    let resultOptions: ProductOption[] = [];
    if (productOptions && Array.isArray(productOptions) && productOptions.length > 0) {
      try {
        resultOptions = await updateProductOptions(productOptions, updatedProduct.id, updatedProduct.optionIds || []);
        
        // Update product with new option IDs
        updatedProduct.optionIds = resultOptions.map(opt => opt.id);
        await productRepository.save(updatedProduct);
        
        console.log(`✅ Updated ${resultOptions.length} product options for product ${updatedProduct.id}`);
      } catch (optionError) {
        console.error("Error updating product options:", optionError);
        return res.status(400).json({ 
          error: "Failed to update product options", 
          details: optionError.message 
        });
      }
    }

    // Return product with options
    const response = {
      ...updatedProduct,
      productOptions: resultOptions
    };

    res.json(response);
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

// Partial update product (PATCH)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Extract productOptions from request body
    const { productOptions, ...productData } = req.body;

    // Update only provided product fields
    Object.assign(product, productData);
    
    // Validate product if any fields were updated
    if (Object.keys(productData).length > 0) {
      const errors = await validate(product);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      
      await productRepository.save(product);
    }
    
    // Add new product options if provided (don't replace existing ones)
    let addedOptions: ProductOption[] = [];
    if (productOptions && Array.isArray(productOptions) && productOptions.length > 0) {
      try {
        addedOptions = await addProductOptions(productOptions, product.id, product.optionIds || []);
        
        // Add new option IDs to existing ones
        const existingOptionIds = product.optionIds || [];
        const newOptionIds = addedOptions.map(opt => opt.id);
        product.optionIds = [...existingOptionIds, ...newOptionIds];
        await productRepository.save(product);
        
        console.log(`✅ Added ${addedOptions.length} new product options to product ${product.id}`);
      } catch (optionError) {
        console.error("Error adding product options:", optionError);
        return res.status(400).json({ 
          error: "Failed to add product options", 
          details: optionError.message 
        });
      }
    }

    // Return product with newly added options
    const response = {
      ...product,
      addedProductOptions: addedOptions
    };

    res.json(response);
  } catch (error) {
    console.error("Error patching product:", error);
    res.status(500).json({ error: "Failed to patch product" });
  }
});

export default router;
