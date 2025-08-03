export enum ShippingRateType {
  FLAT_RATE = "FLAT_RATE",
  WEIGHT_BASED = "WEIGHT_BASED",
  PRICE_BASED = "PRICE_BASED",
  FREE = "FREE",
  CALCULATED = "CALCULATED", // For real-time rates from shipping providers
}
