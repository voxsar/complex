import request from 'supertest';
import express from 'express';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const { AppDataSource } = require('../../data-source');

import orderRoutes from '../../routes/orders';

describe('Orders API', () => {
  beforeEach(() => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue({
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
  });

  it('GET /api/orders returns orders list', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
    expect(Array.isArray(res.body.orders)).toBe(true);
  });
});
