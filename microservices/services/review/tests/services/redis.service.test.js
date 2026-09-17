jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
  })),
}));

describe("Redis Service", () => {
  let redis;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    delete process.env.REDIS_URL;
  });

  test("creates Redis client with default URL", () => {
    jest.isolateModules(() => {
      const redisModule = require("../../src/services/redis.service");

      redis = redisModule.redis;
    });

    expect(redis).toBeDefined();
  });

  test("creates Redis client using configured REDIS_URL", () => {
    process.env.REDIS_URL = "redis://test-redis:6379";

    jest.isolateModules(() => {
      const redisModule = require("../../src/services/redis.service");

      redis = redisModule.redis;
    });

    expect(redis).toBeDefined();
  });

  test("exports redis client", () => {
    jest.isolateModules(() => {
      const redisModule = require("../../src/services/redis.service");

      expect(redisModule).toHaveProperty("redis");
    });
  });
});