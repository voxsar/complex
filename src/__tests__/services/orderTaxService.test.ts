import { OrderTaxService } from '../../utils/orderTaxService';
import { Order } from '../../entities/Order';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../utils/taxCalculation', () => ({
  TaxCalculationService: jest.fn().mockImplementation(() => ({
    calculateTax: jest.fn(),
    findApplicableTaxRegion: jest.fn(),
    calculateTaxForRegion: jest.fn(),
  })),
}));

const { AppDataSource } = require('../../data-source');
const { TaxCalculationService } = require('../../utils/taxCalculation');

describe('OrderTaxService', () => {
  const mockOrderRepo = { findOne: jest.fn(), save: jest.fn() };
  const mockTaxServiceInstance = {
    calculateTax: jest.fn(),
  };

  beforeEach(() => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockOrderRepo);
    (TaxCalculationService as jest.Mock).mockImplementation(() => mockTaxServiceInstance);
    mockOrderRepo.save.mockImplementation(async (order) => order);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('applies tax calculation to order', async () => {
    const order = {
      id: '1',
      subtotal: 100,
      shippingAmount: 0,
      discountAmount: 0,
      shippingAddress: { country: 'US', province: 'CA', city: 'SF', zip: '94103' },
    } as unknown as Order;
    mockOrderRepo.findOne.mockResolvedValue(order);
    mockTaxServiceInstance.calculateTax.mockResolvedValue({ taxAmount: 10, regionId: 'r1', breakdown: [] });

    const service = new OrderTaxService();
    const result = await service.calculateOrderTax('1');

    expect(result.taxAmount).toBe(10);
    expect(result.total).toBe(110);
    expect(mockOrderRepo.save).toHaveBeenCalled();
    expect(mockTaxServiceInstance.calculateTax).toHaveBeenCalled();
  });
});
