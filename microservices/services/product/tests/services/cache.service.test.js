const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
};

jest.mock("../../src/services/redis.service", () => ({
  redis: mockRedis,
}));

const cache = require("../../src/services/cache.service");

describe("cache service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    test("returns null when Redis returns nothing", async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(cache.get("product:1")).resolves.toBeNull();

      expect(mockRedis.get).toHaveBeenCalledWith("product:1");
    });

    test("parses JSON value", async () => {
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          id: "1",
          name: "Phone",
        })
      );

      await expect(cache.get("product:1")).resolves.toEqual({
        id: "1",
        name: "Phone",
      });
    });

    test("returns null when Redis throws", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis error"));

      await expect(cache.get("product:1")).resolves.toBeNull();
    });

    test("returns null when JSON parsing fails", async () => {
      mockRedis.get.mockResolvedValue("invalid-json");

      await expect(cache.get("product:1")).resolves.toBeNull();
    });
  });

  describe("set", () => {
    test("stores JSON with default TTL", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await expect(
        cache.set("product:1", {
          name: "Phone",
        })
      ).resolves.toBe(true);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "product:1",
        JSON.stringify({
          name: "Phone",
        }),
        {
          EX: 300,
        }
      );
    });

    test("supports custom TTL", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await cache.set("product:1", { id: 1 }, 60);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "product:1",
        JSON.stringify({ id: 1 }),
        {
          EX: 60,
        }
      );
    });

    test("returns false when Redis set fails", async () => {
      mockRedis.set.mockRejectedValue(new Error("Redis failure"));

      await expect(
        cache.set("product:1", { id: 1 })
      ).resolves.toBe(false);
    });
  });

  describe("del", () => {
    test("deletes key", async () => {
      mockRedis.del.mockResolvedValue(1);

      await expect(cache.del("product:1")).resolves.toBe(true);

      expect(mockRedis.del).toHaveBeenCalledWith("product:1");
    });

    test("returns false when delete fails", async () => {
      mockRedis.del.mockRejectedValue(new Error("Redis failure"));

      await expect(cache.del("product:1")).resolves.toBe(false);
    });
  });

  describe("delByPattern", () => {
    test("deletes matching keys", async () => {
      mockRedis.scan
        .mockResolvedValueOnce({
          cursor: 0,
          keys: ["products:list:1", "products:list:2"],
        });

      mockRedis.del.mockResolvedValue(2);

      await expect(
        cache.delByPattern("products:list:*")
      ).resolves.toBe(true);

      expect(mockRedis.scan).toHaveBeenCalledWith(0, {
        MATCH: "products:list:*",
        COUNT: 100,
      });

      expect(mockRedis.del).toHaveBeenCalledWith([
        "products:list:1",
        "products:list:2",
      ]);
    });

    test("continues scanning until cursor becomes zero", async () => {
      mockRedis.scan
        .mockResolvedValueOnce({
          cursor: 10,
          keys: ["products:list:1"],
        })
        .mockResolvedValueOnce({
          cursor: 0,
          keys: ["products:list:2"],
        });

      mockRedis.del.mockResolvedValue(1);

      await expect(
        cache.delByPattern("products:list:*")
      ).resolves.toBe(true);

      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
    });

    test("does not call del when scan returns no keys", async () => {
      mockRedis.scan.mockResolvedValue({
        cursor: 0,
        keys: [],
      });

      await cache.delByPattern("products:list:*");

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    test("returns false when scan fails", async () => {
      mockRedis.scan.mockRejectedValue(new Error("Scan failed"));

      await expect(
        cache.delByPattern("products:list:*")
      ).resolves.toBe(false);
    });
  });
});