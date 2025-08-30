export interface Rate {
  serviceCode: string;
  serviceName: string;
  cost: number;
  currency: string;
  estimatedDays?: { min: number; max: number };
  deliveryDate?: string;
}

export interface RateRequest {
  fromAddress: any;
  toAddress: any;
  packages: any[];
  services?: string[];
}

export interface TestResult {
  success: boolean;
  message: string;
}

export interface ShippingAdapter {
  testConnection(credentials: Record<string, any>): Promise<TestResult>;
  getRates(credentials: Record<string, any>, request: RateRequest): Promise<Rate[]>;
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}
