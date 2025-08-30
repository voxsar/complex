import { ShippingProviderType } from "../../enums/shipping_provider_type";
import { UPSAdapter } from "./ups";
import { FedExAdapter } from "./fedex";
import { ShippingAdapter } from "./types";

export { ProviderError } from "./types";
export type { Rate, RateRequest, TestResult } from "./types";

export function getShippingAdapter(type: ShippingProviderType): ShippingAdapter | undefined {
  switch (type) {
    case ShippingProviderType.UPS:
      return new UPSAdapter();
    case ShippingProviderType.FEDEX:
      return new FedExAdapter();
    default:
      return undefined;
  }
}
