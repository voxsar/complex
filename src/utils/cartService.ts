import { AppDataSource } from "../data-source";
import { Cart } from "../entities/Cart";
import { Product } from "../entities/Product";
import { Promotion } from "../entities/Promotion";
import { PriceList } from "../entities/PriceList";
import { TaxRegion } from "../entities/TaxRegion";
import { CartStatus } from "../enums/cart_status";
import { CartType } from "../enums/cart_type";
import { PromotionStatus } from "../enums/promotion_status";
import { TaxRegionStatus } from "../enums/tax_region_status";
import { Repository, LessThan } from "typeorm";
import i18n from "./i18n";

export class CartService {
  private cartRepository: Repository<Cart>;
  private productRepository: Repository<Product>;
  private promotionRepository: Repository<Promotion>;
  private priceListRepository: Repository<PriceList>;
  private taxRegionRepository: Repository<TaxRegion>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.productRepository = AppDataSource.getRepository(Product);
    this.promotionRepository = AppDataSource.getRepository(Promotion);
    this.priceListRepository = AppDataSource.getRepository(PriceList);
    this.taxRegionRepository = AppDataSource.getRepository(TaxRegion);
  }

  async createCart(data: {
    customerId?: string;
    email?: string;
    currency: string;
    salesChannelId?: string;
    regionId?: string;
    sessionId?: string;
    type?: CartType;
  }): Promise<Cart> {
    const cart = new Cart();
    
    Object.assign(cart, {
      ...data,
      status: CartStatus.ACTIVE,
      type: data.type || CartType.DEFAULT,
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      total: 0,
      items: [],
      discounts: [],
      shippingMethods: [],
      paymentSessions: [],
      taxBreakdown: []
    });

    return await this.cartRepository.save(cart);
  }

  async getCart(cartId: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({ where: { id: cartId } });
  }

  async getActiveCartByCustomer(customerId: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({
      where: {
        customerId,
        status: CartStatus.ACTIVE
      },
      order: { updatedAt: "DESC" }
    });
  }

  async getActiveCartBySession(sessionId: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({
      where: {
        sessionId,
        status: CartStatus.ACTIVE
      },
      order: { updatedAt: "DESC" }
    });
  }

  async addLineItem(cartId: string, data: {
    productId: string;
    variantId: string;
    quantity: number;
    metadata?: Record<string, any>;
  }): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Get product details for snapshot
    const product = await this.productRepository.findOne({
      where: { id: data.productId }
    });

    if (!product) {
      throw new Error(i18n.t("errors.product_not_found"));
    }

    const variant = product.variants?.find(v => v.id === data.variantId);
    if (!variant) {
      throw new Error("Product variant not found");
    }

    // Get price (check price lists first, then fallback to base price)
    const price = await this.getVariantPrice(data.variantId, cart.currency, cart.priceListId);

    // Create product snapshot
    const productSnapshot = {
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        images: product.images || [],
        handle: product.slug // Using slug as handle
      },
      variant: {
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price: variant.price,
        optionValues: variant.optionValues || [],
        inventory: {
          available: variant.inventory?.quantity || 0,
          reserved: 0 // This would come from inventory service
        }
      }
    };

    cart.addLineItem({
      productId: data.productId,
      variantId: data.variantId,
      quantity: data.quantity,
      unitPrice: price,
      productTitle: product.title,
      variantTitle: variant.title,
      productSku: variant.sku,
      productSnapshot,
      metadata: data.metadata
    });

    // Recalculate taxes if tax region is set
    if (cart.taxRegionId) {
      await this.calculateTaxes(cart);
    }

    return await this.cartRepository.save(cart);
  }

  async updateLineItem(cartId: string, itemId: string, data: {
    quantity?: number;
  }): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error("Cart item not found");
    }

    if (data.quantity !== undefined) {
      if (data.quantity <= 0) {
        cart.removeLineItem(itemId);
      } else {
        cart.updateLineItem(itemId, { quantity: data.quantity });
      }
    }

    // Recalculate taxes if tax region is set
    if (cart.taxRegionId) {
      await this.calculateTaxes(cart);
    }

    return await this.cartRepository.save(cart);
  }

  async removeLineItem(cartId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.removeLineItem(itemId);

    // Recalculate taxes if tax region is set
    if (cart.taxRegionId) {
      await this.calculateTaxes(cart);
    }

    return await this.cartRepository.save(cart);
  }

  async applyDiscount(cartId: string, promotionId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Find promotion by ID
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId, status: PromotionStatus.ACTIVE }
    });

    if (!promotion || !promotion.isActive) {
      throw new Error("Invalid or expired promotion");
    }

    // Calculate discount amount
    const discountAmount = this.calculateDiscountAmount(cart, promotion);

    cart.applyDiscount({
      id: `discount_${Date.now()}`,
      promotionId: promotion.id,
      promotionTitle: promotion.name,
      type: promotion.type as 'percentage' | 'fixed_amount' | 'free_shipping',
      value: promotion.discountValue || 0,
      discountAmount
    });

    return await this.cartRepository.save(cart);
  }

  async removeDiscount(cartId: string, discountId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.removeDiscount(discountId);
    return await this.cartRepository.save(cart);
  }

  async updateAddresses(cartId: string, data: {
    billingAddress?: any;
    shippingAddress?: any;
  }): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    if (data.billingAddress) {
      cart.billingAddress = data.billingAddress;
    }

    if (data.shippingAddress) {
      cart.shippingAddress = data.shippingAddress;
      
      // Update tax region based on shipping address
      if (data.shippingAddress.country) {
        const taxRegion = await this.findTaxRegion(
          data.shippingAddress.country,
          data.shippingAddress.province
        );
        if (taxRegion) {
          cart.taxRegionId = taxRegion.id;
          await this.calculateTaxes(cart);
        }
      }
    }

    return await this.cartRepository.save(cart);
  }

  async setShippingMethod(cartId: string, shippingMethod: {
    shippingOptionId: string;
    name: string;
    price: number;
    data?: Record<string, any>;
  }): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.setShippingMethod({
      id: `shipping_${Date.now()}`,
      ...shippingMethod
    });

    return await this.cartRepository.save(cart);
  }

  async completeCart(cartId: string, orderId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.markAsCompleted(orderId);
    return await this.cartRepository.save(cart);
  }

  async abandonCart(cartId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.markAsAbandoned();
    return await this.cartRepository.save(cart);
  }

  async cleanupExpiredCarts(): Promise<number> {
    const expiredCarts = await this.cartRepository.find({
      where: {
        status: CartStatus.ACTIVE,
        expiresAt: LessThan(new Date())
      }
    });

    for (const cart of expiredCarts) {
      cart.status = CartStatus.EXPIRED;
      await this.cartRepository.save(cart);
    }

    return expiredCarts.length;
  }

  // Helper methods
  private async getVariantPrice(
    variantId: string, 
    currency: string, 
    priceListId?: string
  ): Promise<number> {
    if (priceListId) {
      const priceList = await this.priceListRepository.findOne({
        where: { id: priceListId }
      });

      if (priceList && priceList.isActive) {
        const price = priceList.prices.find(p => 
          p.variantId === variantId && p.currency === currency
        );
        if (price) {
          return price.amount;
        }
      }
    }

    // Fallback to product variant base price
    // For simplicity, we'll search through all products to find the variant
    const products = await this.productRepository.find();
    
    for (const product of products) {
      const variant = product.variants?.find(v => v.id === variantId);
      if (variant) {
        return variant.price;
      }
    }

    return 0;
  }

  private calculateDiscountAmount(cart: Cart, promotion: Promotion): number {
    switch (promotion.type) {
      case "percentage":
        return Math.round((cart.subtotal * (promotion.discountValue || 0)) / 100 * 100) / 100;
      case "fixed_amount":
        return Math.min(promotion.discountValue || 0, cart.subtotal);
      case "free_shipping":
        return cart.shippingAmount;
      default:
        return 0;
    }
  }

  private async findTaxRegion(countryCode: string, provinceCode?: string): Promise<TaxRegion | null> {
    // First try to find specific province/state region
    if (provinceCode) {
      const subRegion = await this.taxRegionRepository.findOne({
        where: {
          countryCode: countryCode.toUpperCase(),
          subdivisionCode: `${countryCode.toUpperCase()}-${provinceCode.toUpperCase()}`,
          status: TaxRegionStatus.ACTIVE
        }
      });
      if (subRegion) return subRegion;
    }

    // Fallback to country-level region
    return await this.taxRegionRepository.findOne({
      where: {
        countryCode: countryCode.toUpperCase(),
        subdivisionCode: undefined,
        status: TaxRegionStatus.ACTIVE
      }
    });
  }

  private async calculateTaxes(cart: Cart): Promise<void> {
    if (!cart.taxRegionId) return;

    const taxRegion = await this.taxRegionRepository.findOne({
      where: { id: cart.taxRegionId }
    });

    if (!taxRegion) return;

    // Reset tax breakdown
    cart.taxBreakdown = [];
    cart.taxAmount = 0;

    // Apply default tax rate (stored as decimal, e.g., 0.08 for 8%)
    if (taxRegion.defaultTaxRate && taxRegion.defaultTaxRate > 0) {
      const taxAmount = Math.round((cart.subtotal * taxRegion.defaultTaxRate) * 100) / 100;
      
      cart.taxBreakdown.push({
        name: taxRegion.defaultTaxRateName || "Tax",
        rate: taxRegion.defaultTaxRate * 100, // Convert to percentage for display
        amount: taxAmount,
        source: "default"
      });

      cart.taxAmount += taxAmount;
    }

    // Apply tax overrides for specific products
    for (const item of cart.items) {
      const override = taxRegion.taxOverrides?.find(override => 
        override.targets.some(target => 
          target.type === "product" && target.targetId === item.productId
        )
      );

      if (override) {
        const overrideTax = Math.round((item.total * override.rate) * 100) / 100;
        
        // If combinable, add to existing tax, otherwise replace
        if (override.combinable) {
          cart.taxAmount += overrideTax;
          cart.taxBreakdown.push({
            name: override.name,
            rate: override.rate * 100, // Convert to percentage for display
            amount: overrideTax,
            source: "override"
          });
        } else {
          // Remove default tax for this item and apply override
          const defaultTaxForItem = Math.round((item.total * (taxRegion.defaultTaxRate || 0)) * 100) / 100;
          cart.taxAmount = cart.taxAmount - defaultTaxForItem + overrideTax;
          
          // Update breakdown
          const defaultBreakdown = cart.taxBreakdown.find(b => b.source === "default");
          if (defaultBreakdown) {
            defaultBreakdown.amount -= defaultTaxForItem;
          }
          
          cart.taxBreakdown.push({
            name: override.name,
            rate: override.rate * 100, // Convert to percentage for display
            amount: overrideTax,
            source: "override"
          });
        }
      }
    }

    cart.recalculateTotals();
  }
}
