import axios from 'axios';

/**
 * Service for currency conversion using externally fetched exchange rates.
 * Rates are cached in memory and refreshed on a schedule.
 */
export class CurrencyService {
  private baseCurrency: string;
  private rates: Record<string, number> = {};
  private lastFetched: number = 0; // unix ms
  private readonly cacheDuration: number; // ms
  private readonly refreshInterval: number; // ms
  private refreshTimer?: NodeJS.Timeout;

  constructor() {
    // Default/base currency configurable via env, default to USD
    this.baseCurrency = (process.env.DEFAULT_CURRENCY || 'USD').toUpperCase();
    // Cache duration and refresh interval (default 1 hour)
    this.refreshInterval = parseInt(process.env.CURRENCY_REFRESH_INTERVAL_MS || '3600000', 10);
    this.cacheDuration = this.refreshInterval;

    // Initial fetch and scheduled refresh
    this.fetchRates().catch(err => {
      logger.error({ err }, 'Failed to load initial exchange rates');
    });
    this.refreshTimer = setInterval(() => {
      this.fetchRates(true).catch(err => {
        logger.error({ err }, 'Failed to refresh exchange rates');
      });
    }, this.refreshInterval);
  }

  /**
   * Fetches exchange rates from provider and caches them.
   * Uses https://open.er-api.com which requires no API key.
   */
  private async fetchRates(force = false): Promise<void> {
    if (!force && this.lastFetched && Date.now() - this.lastFetched < this.cacheDuration) {
      return; // Use cached rates
    }

    try {
      const url = process.env.CURRENCY_API_URL || `https://open.er-api.com/v6/latest/${this.baseCurrency}`;
      const response = await axios.get<{ rates: Record<string, number>; base_code?: string }>(url);
      const data = response.data;
      if (data && data.rates) {
        this.rates = data.rates;
        this.lastFetched = Date.now();
        if (data.base_code) {
          this.baseCurrency = data.base_code.toUpperCase();
        }
      } else {
        throw new Error('Invalid response from currency provider');
      }
    } catch (error: any) {
      // Don't throw to avoid crashing callers; keep last known rates
      logger.error({ err: error }, 'Error fetching exchange rates');
    }
  }

  /**
   * Get exchange rate for a target currency relative to base.
   */
  private getRate(currency: string): number | undefined {
    if (currency.toUpperCase() === this.baseCurrency) return 1;
    return this.rates[currency.toUpperCase()];
  }

  /**
   * Convert an amount between currencies.
   * Used by price lists, cart totals, and order summaries.
   */
  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) return amount;

    await this.fetchRates();

    // Convert from source to base
    let inBase = amount;
    if (fromCurrency !== this.baseCurrency) {
      const fromRate = this.getRate(fromCurrency);
      if (!fromRate) throw new Error(`Unsupported currency: ${fromCurrency}`);
      inBase = amount / fromRate;
    }

    // Convert from base to target
    const toRate = this.getRate(toCurrency);
    if (!toRate) throw new Error(`Unsupported currency: ${toCurrency}`);
    return inBase * toRate;
  }

  /**
   * Convenience method to convert multiple prices (e.g., price lists).
   */
  async convertPrices(
    prices: Array<{ amount: number; currency: string }>,
    toCurrency: string
  ): Promise<Array<{ amount: number; currency: string }>> {
    const result = [] as Array<{ amount: number; currency: string }>;
    for (const price of prices) {
      const amount = await this.convert(price.amount, price.currency, toCurrency);
      result.push({ amount, currency: toCurrency.toUpperCase() });
    }
    return result;
  }

  /**
   * Convert cart total to a different currency.
   */
  async convertCartTotal(total: number, fromCurrency: string, toCurrency: string): Promise<number> {
    return this.convert(total, fromCurrency, toCurrency);
  }

  /**
   * Convert order summary total to a different currency.
   */
  async convertOrderTotal(total: number, fromCurrency: string, toCurrency: string): Promise<number> {
    return this.convert(total, fromCurrency, toCurrency);
  }

  /**
   * Get currently configured base currency.
   */
  getBaseCurrency(): string {
    return this.baseCurrency;
  }

  /**
   * Update base currency and refresh rates immediately.
   */
  async setBaseCurrency(currency: string): Promise<void> {
    this.baseCurrency = currency.toUpperCase();
    await this.fetchRates(true);
  }
}

// Export a singleton instance to be reused across the app
const currencyService = new CurrencyService();
export default currencyService;
