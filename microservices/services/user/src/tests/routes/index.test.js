jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => { req.user = { id: 'u1', role: 'USER' }; next(); },
  authorize: () => (req, res, next) => next(),
}));
jest.mock('../../controllers/user.controller', () => ({ me: jest.fn((req, res) => res.status(200).json({ me: true })), update: jest.fn((req, res) => res.status(200).json({ update: true })) }));
const request = require('supertest');
const express = require('express');
const router = require('../../routes');
const controller = require('../../controllers/user.controller');

describe('user routes', () => {
  test('GET /api/users/me is wired', async () => {
    const app = express(); app.use(router);
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(200); expect(controller.me).toHaveBeenCalled();
  });
  test('PATCH /api/users/me is wired', async () => {
    const app = express(); app.use(express.json()); app.use(router);
    const res = await request(app).patch('/api/users/me').send({ name: 'N' });
    expect(res.status).toBe(200); expect(controller.update).toHaveBeenCalled();
  });
});
