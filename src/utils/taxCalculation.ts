import { AppDataSource } from "../data-source";
import { TaxRegion } from "../entities/TaxRegion";
import { TaxRegionStatus } from "../enums/tax_region_status";

export interface TaxCalculationRequest {
  countryCode: string;
  subdivisionCode?: string;
  productId?: string;
  productType?: string;
  amount: number;
  shippingAddress?: {
    country: string;
    state?: string;
    province?: string;
    city?: string;
    postalCode?: string;
  };
}

export interface TaxCalculationResult {
  regionId: string;
  regionName: string;
  taxRate: number;
  taxRatePercentage: number;
  taxAmount: number;
  totalAmount: number;
  breakdown: Array<{
    name: string;
    rate: number;
    amount: number;
    source: 'default' | 'override' | 'parent';
  }>;
}

export class TaxCalculationService {
  private taxRegionRepository = AppDataSource.getRepository(TaxRegion);

  /**
   * Calculate tax for a product based on shipping address and product details
   */
  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult | null> {
    const { countryCode, subdivisionCode, productId, productType, amount, shippingAddress } = request;

    // Determine the appropriate tax region
    const taxRegion = await this.findApplicableTaxRegion(
      countryCode,
      subdivisionCode || shippingAddress?.state || shippingAddress?.province
    );

    if (!taxRegion) {
      return null;
    }

    return this.calculateTaxForRegion(taxRegion, productId, productType, amount);
  }

  /**
   * Calculate tax for a specific region
   */
  async calculateTaxForRegion(
    taxRegion: TaxRegion,
    productId?: string,
    productType?: string,
    amount: number = 0
  ): Promise<TaxCalculationResult> {
    const breakdown: Array<{
      name: string;
      rate: number;
      amount: number;
      source: 'default' | 'override' | 'parent';
    }> = [];

    let totalTaxRate = 0;

    // Get parent region tax if this is a subregion and should combine with parent
    if (taxRegion.isSubregion && taxRegion.defaultCombinableWithParent && taxRegion.parentRegionId) {
      const parentRegion = await this.taxRegionRepository.findOne({
        where: { id: taxRegion.parentRegionId }
      });

      if (parentRegion && parentRegion.hasDefaultTaxRate) {
        const parentRate = parentRegion.getTaxRateForProduct(productId, productType);
        totalTaxRate += parentRate;
        
        breakdown.push({
          name: `${parentRegion.name} Tax`,
          rate: parentRate,
          amount: amount * parentRate,
          source: 'parent'
        });
      }
    }

    // Calculate tax rate for this region
    const regionTaxRate = taxRegion.getTaxRateForProduct(productId, productType);
    
    // Check if this rate comes from an override
    const hasOverride = productId && taxRegion.taxOverrides?.some(override =>
      override.targets.some(target => 
        (target.type === 'product' && target.targetId === productId) ||
        (target.type === 'product_type' && productType && target.targetId === productType)
      )
    );

    if (regionTaxRate > 0) {
      breakdown.push({
        name: taxRegion.defaultTaxRateName || `${taxRegion.name} Tax`,
        rate: regionTaxRate,
        amount: amount * regionTaxRate,
        source: hasOverride ? 'override' : 'default'
      });

      totalTaxRate += regionTaxRate;
    }

    const taxAmount = amount * totalTaxRate;

    return {
      regionId: taxRegion.id,
      regionName: taxRegion.name,
      taxRate: totalTaxRate,
      taxRatePercentage: totalTaxRate * 100,
      taxAmount,
      totalAmount: amount + taxAmount,
      breakdown
    };
  }

  /**
   * Find the most specific applicable tax region
   */
  async findApplicableTaxRegion(
    countryCode: string,
    subdivisionCode?: string
  ): Promise<TaxRegion | null> {
    // First try to find a subregion if subdivision code is provided
    if (subdivisionCode) {
      const subregion = await this.taxRegionRepository.findOne({
        where: {
          countryCode: countryCode.toUpperCase(),
          subdivisionCode: subdivisionCode.toUpperCase(),
          status: TaxRegionStatus.ACTIVE
        }
      });

      if (subregion) {
        return subregion;
      }
    }

    // Fall back to country-level region
    const countryRegion = await this.taxRegionRepository.findOne({
      where: {
        countryCode: countryCode.toUpperCase(),
        parentRegionId: null,
        status: TaxRegionStatus.ACTIVE,
        isDefault: true
      }
    });

    return countryRegion;
  }

  /**
   * Get all active tax regions for a country
   */
  async getTaxRegionsForCountry(countryCode: string): Promise<TaxRegion[]> {
    return this.taxRegionRepository.find({
      where: {
        countryCode: countryCode.toUpperCase(),
        status: TaxRegionStatus.ACTIVE
      },
      order: {
        parentRegionId: "ASC",
        name: "ASC"
      }
    });
  }

  /**
   * Get default tax region for a country
   */
  async getDefaultTaxRegion(countryCode: string): Promise<TaxRegion | null> {
    return this.taxRegionRepository.findOne({
      where: {
        countryCode: countryCode.toUpperCase(),
        isDefault: true,
        parentRegionId: null,
        status: TaxRegionStatus.ACTIVE
      }
    });
  }

  /**
   * Validate tax calculation request
   */
  validateTaxCalculationRequest(request: TaxCalculationRequest): string[] {
    const errors: string[] = [];

    if (!request.countryCode) {
      errors.push("Country code is required");
    }

    if (request.amount < 0) {
      errors.push("Amount must be non-negative");
    }

    if (request.countryCode && !/^[A-Z]{2}$/.test(request.countryCode.toUpperCase())) {
      errors.push("Country code must be a valid ISO 3166-1 alpha-2 code");
    }

    return errors;
  }
}
