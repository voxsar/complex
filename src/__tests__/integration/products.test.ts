import request from 'supertest';
import express from 'express';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    getMongoRepository: jest.fn(),
  },
}));

const { AppDataSource } = require('../../data-source');

import productRoutes from '../../routes/products';

describe('Products API', () => {
  beforeEach(() => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue({
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    (AppDataSource.getMongoRepository as jest.Mock).mockReturnValue({
      createCollectionIndex: jest.fn(),
    });
  });

  it('GET /api/products returns products list', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/products', productRoutes);
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});
