jest.mock('../routes', () => require('express').Router());
jest.mock('@shopsphere/common', () => ({
  requestId: (req, res, next) => next(),
  notFound: (req, res) => res.status(404).json({ success: false, message: 'Not found' }),
  errorHandler: (err, req, res, next) => res.status(500).json({ success: false }),
}));
const request = require('supertest');
const app = require('../app');

describe('user app', () => {
  test('health endpoint works', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200); expect(res.body.success).toBe(true); expect(res.body.service).toBe('shopsphere-user'); expect(res.body.timestamp).toBeDefined();
  });
  test('unknown route reaches notFound', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404); expect(res.body.success).toBe(false);
  });
});
