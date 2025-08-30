import { ShippingAdapter, RateRequest, Rate, ProviderError, TestResult } from "./types";

export class FedExAdapter implements ShippingAdapter {
  async testConnection(credentials: Record<string, any>): Promise<TestResult> {
    const { apiKey, apiSecret, accountNumber, meterNumber } = credentials;
    if (!apiKey || !apiSecret || !accountNumber || !meterNumber) {
      throw new ProviderError("Missing FedEx credentials");
    }

    // Simulated connection test
    return {
      success: true,
      message: "FedEx connection successful",
    };
  }

  async getRates(credentials: Record<string, any>, request: RateRequest): Promise<Rate[]> {
    const { apiKey, apiSecret, accountNumber, meterNumber } = credentials;
    if (!apiKey || !apiSecret || !accountNumber || !meterNumber) {
      throw new ProviderError("Missing FedEx credentials");
    }

    if (!request.fromAddress || !request.toAddress || !request.packages?.length) {
      throw new ProviderError("Invalid rate request");
    }

    const now = Date.now();
    return [
      {
        serviceCode: "FEDEX_GROUND",
        serviceName: "FedEx Ground",
        cost: 13,
        currency: "USD",
        estimatedDays: { min: 3, max: 5 },
        deliveryDate: new Date(now + 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        serviceCode: "PRIORITY_OVERNIGHT",
        serviceName: "Priority Overnight",
        cost: 30,
        currency: "USD",
        estimatedDays: { min: 1, max: 1 },
        deliveryDate: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}
