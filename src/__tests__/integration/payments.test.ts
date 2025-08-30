import request from 'supertest';
import express from 'express';

jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const { AppDataSource } = require('../../data-source');

import paymentRoutes from '../../routes/payments';

describe('Payments API', () => {
  beforeEach(() => {
    (AppDataSource.getRepository as jest.Mock).mockReturnValue({
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
  });

  it('GET /api/payments returns payments list', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/payments', paymentRoutes);
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('payments');
    expect(Array.isArray(res.body.payments)).toBe(true);
  });
});
