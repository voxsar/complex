import { AppDataSource } from "../data-source";
import { Order } from "../entities/Order";
import { TaxCalculationService } from "../utils/taxCalculation";

/**
 * Example service showing how to integrate tax calculation with order processing
 */
export class OrderTaxService {
  private taxService = new TaxCalculationService();
  private orderRepository = AppDataSource.getRepository(Order);

  /**
   * Calculate and apply tax to an order based on shipping address
   */
  async calculateOrderTax(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.shippingAddress) {
      throw new Error("Shipping address is required for tax calculation");
    }

    // Extract country and state/province from shipping address
    const countryCode = order.shippingAddress.country;
    const subdivisionCode = order.shippingAddress.province;

    // Calculate tax for the order
    const taxCalculation = await this.taxService.calculateTax({
      countryCode,
      subdivisionCode,
      amount: order.subtotal,
      shippingAddress: {
        country: order.shippingAddress.country,
        state: order.shippingAddress.province,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.zip
      }
    });

    if (taxCalculation) {
      // Apply tax to order
      order.taxAmount = taxCalculation.taxAmount;
      order.taxRegionId = taxCalculation.regionId;
      order.taxBreakdown = taxCalculation.breakdown;
      
      // Recalculate total
      order.total = order.subtotal + order.taxAmount + order.shippingAmount - order.discountAmount;
    } else {
      // No tax region found, set tax to 0
      order.taxAmount = 0;
      order.taxRegionId = undefined;
      order.taxBreakdown = [];
      order.total = order.subtotal + order.shippingAmount - order.discountAmount;
    }

    // Save the updated order
    return await this.orderRepository.save(order);
  }

  /**
   * Calculate tax for individual order items with product-specific rates
   */
  async calculateItemLevelTax(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.shippingAddress) {
      throw new Error("Shipping address is required for tax calculation");
    }

    // Find applicable tax region
    const countryCode = order.shippingAddress.country;
    const subdivisionCode = order.shippingAddress.province;
    
    const taxRegion = await this.taxService.findApplicableTaxRegion(countryCode, subdivisionCode);
    
    if (!taxRegion) {
      order.taxAmount = 0;
      order.taxRegionId = undefined;
      order.taxBreakdown = [];
      order.total = order.subtotal + order.shippingAmount - order.discountAmount;
      return await this.orderRepository.save(order);
    }

    let totalTax = 0;
    const breakdown: Array<{
      name: string;
      rate: number;
      amount: number;
      source: 'default' | 'override' | 'parent';
    }> = [];

    // Calculate tax for each item
    for (const item of order.items) {
      // Extract product ID from snapshot or use item ID
      const productId = item.productSnapshot?.product?.id || item.id;
      const productType = "physical"; // Default to physical, could be enhanced with actual product type lookup
      
      const itemTax = await this.taxService.calculateTaxForRegion(
        taxRegion,
        productId,
        productType,
        item.total
      );

      totalTax += itemTax.taxAmount;
      
      // Add item-specific breakdown
      breakdown.push({
        name: `${item.productTitle} Tax`,
        rate: itemTax.taxRate,
        amount: itemTax.taxAmount,
        source: 'default' // Could be enhanced to detect override source
      });
    }

    order.taxAmount = totalTax;
    order.taxRegionId = taxRegion.id;
    order.taxBreakdown = breakdown;
    order.total = order.subtotal + order.taxAmount + order.shippingAmount - order.discountAmount;

    return await this.orderRepository.save(order);
  }

  /**
   * Handle tax exemption for an order
   */
  async applyTaxExemption(orderId: string, reason: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    order.taxExempt = true;
    order.taxExemptReason = reason;
    order.taxAmount = 0;
    order.taxBreakdown = [];
    order.total = order.subtotal + order.shippingAmount - order.discountAmount;

    return await this.orderRepository.save(order);
  }

  /**
   * Remove tax exemption and recalculate tax
   */
  async removeTaxExemption(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    order.taxExempt = false;
    order.taxExemptReason = undefined;

    // Recalculate tax
    return await this.calculateOrderTax(orderId);
  }

  /**
   * Get tax summary for reporting
   */
  async getOrderTaxSummary(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      taxRegionId: order.taxRegionId,
      taxExempt: order.taxExempt,
      taxExemptReason: order.taxExemptReason,
      taxBreakdown: order.taxBreakdown,
      shippingAddress: order.shippingAddress,
      currency: order.currency
    };
  }
}
