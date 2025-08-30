import { CartService } from '../../utils/cartService';
import { Cart } from '../../entities/Cart';
import { Product } from '../../entities/Product';
import { Promotion } from '../../entities/Promotion';
import { PriceList } from '../../entities/PriceList';
import { TaxRegion } from '../../entities/TaxRegion';
import { CartStatus } from '../../enums/cart_status';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const { AppDataSource } = require('../../data-source');

describe('CartService', () => {
  const mockCartRepo = { save: jest.fn(), findOne: jest.fn() };
  const mockProductRepo = { findOne: jest.fn() };
  const mockPromotionRepo = {};
  const mockPriceListRepo = {};
  const mockTaxRegionRepo = {};

  beforeEach(() => {
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Cart) return mockCartRepo;
      if (entity === Product) return mockProductRepo;
      if (entity === Promotion) return mockPromotionRepo;
      if (entity === PriceList) return mockPriceListRepo;
      if (entity === TaxRegion) return mockTaxRegionRepo;
      return {};
    });
    mockCartRepo.save.mockImplementation(async (cart) => cart);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates cart with defaults', async () => {
    const service = new CartService();
    const cart = await service.createCart({ currency: 'USD' });
    expect(mockCartRepo.save).toHaveBeenCalled();
    expect(cart.status).toBe(CartStatus.ACTIVE);
    expect(cart.total).toBe(0);
    expect(cart.currency).toBe('USD');
  });

  it('gets cart by id', async () => {
    const service = new CartService();
    const mockCart = { id: '1' } as Cart;
    mockCartRepo.findOne.mockResolvedValueOnce(mockCart);
    const result = await service.getCart('1');
    expect(result).toBe(mockCart);
    expect(mockCartRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
