jest.mock("../../src/services/redis.service", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

const { redis } = require("../../src/services/redis.service");

const cache = require("../../src/services/cache.service");

describe("Cache Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    delete process.env.REDIS_REVIEW_TTL;
  });

  describe("get", () => {
    test("returns parsed value when Redis contains data", async () => {
      redis.get.mockResolvedValue(
        JSON.stringify({
          productId: "product123",
          rating: 5,
        })
      );

      const result = await cache.get(
        "reviews:product:product123"
      );

      expect(redis.get).toHaveBeenCalledWith(
        "reviews:product:product123"
      );

      expect(result).toEqual({
        productId: "product123",
        rating: 5,
      });
    });

    test("returns null when Redis returns no value", async () => {
      redis.get.mockResolvedValue(null);

      const result = await cache.get(
        "reviews:product:product123"
      );

      expect(result).toBeNull();
    });

    test("returns null when Redis returns an empty string", async () => {
      redis.get.mockResolvedValue("");

      const result = await cache.get(
        "reviews:product:product123"
      );

      expect(result).toBeNull();
    });

    test("returns null when cached JSON is invalid", async () => {
      redis.get.mockResolvedValue("invalid-json");

      const result = await cache.get(
        "reviews:product:product123"
      );

      expect(result).toBeNull();
    });

    test("returns null when Redis get fails", async () => {
      redis.get.mockRejectedValue(
        new Error("Redis connection failed")
      );

      const result = await cache.get(
        "reviews:product:product123"
      );

      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    test("stores JSON string in Redis with default TTL", async () => {
      redis.set.mockResolvedValue("OK");

      const value = {
        productId: "product123",
        rating: 5,
      };

      const result = await cache.set(
        "reviews:product:product123",
        value
      );

      expect(redis.set).toHaveBeenCalledWith(
        "reviews:product:product123",
        JSON.stringify(value),
        {
          EX: 300,
        }
      );

      expect(result).toBe(true);
    });

    test("uses custom TTL when provided", async () => {
      redis.set.mockResolvedValue("OK");

      const value = {
        productId: "product123",
        rating: 4,
      };

      const result = await cache.set(
        "reviews:product:product123",
        value,
        60
      );

      expect(redis.set).toHaveBeenCalledWith(
        "reviews:product:product123",
        JSON.stringify(value),
        {
          EX: 60,
        }
      );

      expect(result).toBe(true);
    });

    test("can store arrays", async () => {
      redis.set.mockResolvedValue("OK");

      const reviews = [
        {
          productId: "product123",
          rating: 5,
        },
        {
          productId: "product123",
          rating: 4,
        },
      ];

      const result = await cache.set(
        "reviews:product:product123",
        reviews
      );

      expect(redis.set).toHaveBeenCalledWith(
        "reviews:product:product123",
        JSON.stringify(reviews),
        {
          EX: 300,
        }
      );

      expect(result).toBe(true);
    });

    test("returns false when Redis set fails", async () => {
      redis.set.mockRejectedValue(
        new Error("Redis connection failed")
      );

      const result = await cache.set(
        "reviews:product:product123",
        {
          rating: 5,
        }
      );

      expect(result).toBe(false);
    });
  });

  describe("del", () => {
    test("deletes the specified cache key", async () => {
      redis.del.mockResolvedValue(1);

      const result = await cache.del(
        "reviews:product:product123"
      );

      expect(redis.del).toHaveBeenCalledWith(
        "reviews:product:product123"
      );

      expect(result).toBe(true);
    });

    test("returns true even when key does not exist", async () => {
      redis.del.mockResolvedValue(0);

      const result = await cache.del(
        "reviews:product:product123"
      );

      expect(redis.del).toHaveBeenCalledWith(
        "reviews:product:product123"
      );

      expect(result).toBe(true);
    });

    test("returns false when Redis delete fails", async () => {
      redis.del.mockRejectedValue(
        new Error("Redis connection failed")
      );

      const result = await cache.del(
        "reviews:product:product123"
      );

      expect(result).toBe(false);
    });
  });
});