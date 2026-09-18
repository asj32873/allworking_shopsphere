jest.mock('mongoose', () => ({
  set: jest.fn(),
  connect: jest.fn(),
  connection: { host: 'localhost', name: 'users' },
}));

describe('user db', () => {
  beforeEach(() => jest.clearAllMocks());

  test('throws when MONGODB_URI is not configured', async () => {
    delete process.env.MONGODB_URI;
    const connectDB = require('../../src/config/db');
    await expect(connectDB()).rejects.toThrow('MONGODB_URI is not configured');
  });

  test('sets strictQuery and connects successfully', async () => {
    process.env.MONGODB_URI = 'mongodb://example/users';
    const mongoose = require('mongoose');
    const connectDB = require('../../src/config/db');
    await connectDB();
    expect(mongoose.set).toHaveBeenCalledWith('strictQuery', true);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    delete process.env.MONGODB_URI;
  });

  test('propagates mongoose connection errors', async () => {
    process.env.MONGODB_URI = 'mongodb://example/users';
    const mongoose = require('mongoose');
    mongoose.connect.mockRejectedValueOnce(new Error('db down'));
    const connectDB = require('../../src/config/db');
    await expect(connectDB()).rejects.toThrow('db down');
    delete process.env.MONGODB_URI;
  });
});
