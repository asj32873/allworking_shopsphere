const mockRedis = {
  on: jest.fn(),
  connect: jest.fn(),
  quit: jest.fn(),
};

const mockCreateClient = jest.fn(() => mockRedis);

jest.mock("redis", () => ({
  createClient: mockCreateClient,
}));

describe("redis service", () => {
  let redisService;

  beforeEach(() => {
    jest.resetModules();

    jest.doMock("redis", () => ({
      createClient: mockCreateClient,
    }));

    mockRedis.on.mockClear();
    mockRedis.connect.mockClear();
    mockRedis.quit.mockClear();
    mockCreateClient.mockClear();

    redisService = require("../../src/services/redis.service");
  });

  test("creates Redis client with default URL", () => {
    expect(mockCreateClient).toHaveBeenCalledWith({
      url: "redis://localhost:6379",
    });
  });

  test("registers Redis event handlers", () => {
    expect(mockRedis.on).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );

    expect(mockRedis.on).toHaveBeenCalledWith(
      "ready",
      expect.any(Function)
    );

    expect(mockRedis.on).toHaveBeenCalledWith(
      "reconnecting",
      expect.any(Function)
    );
  });

  test("connectRedis connects only once", async () => {
    mockRedis.connect.mockResolvedValue(undefined);

    await redisService.connectRedis();
    await redisService.connectRedis();

    expect(mockRedis.connect).toHaveBeenCalledTimes(1);
  });

  test("disconnectRedis does nothing when not connected", async () => {
    await redisService.disconnectRedis();

    expect(mockRedis.quit).not.toHaveBeenCalled();
  });

  test("disconnectRedis quits connected client", async () => {
    mockRedis.connect.mockResolvedValue(undefined);
    mockRedis.quit.mockResolvedValue(undefined);

    await redisService.connectRedis();
    await redisService.disconnectRedis();

    expect(mockRedis.quit).toHaveBeenCalledTimes(1);
  });

  test("can reconnect after disconnect", async () => {
    mockRedis.connect.mockResolvedValue(undefined);
    mockRedis.quit.mockResolvedValue(undefined);

    await redisService.connectRedis();
    await redisService.disconnectRedis();
    await redisService.connectRedis();

    expect(mockRedis.connect).toHaveBeenCalledTimes(2);
  });
});