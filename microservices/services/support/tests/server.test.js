jest.mock("../src/app", () => ({
  listen: jest.fn((port, host, callback) => {
    callback();
    return { close: jest.fn() };
  }),
}));

jest.mock("../src/config/db", () => jest.fn());

describe("support server", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.PORT = "6011";
  });

  test("connects to DB and starts server", async () => {
    const connectDB = require("../src/config/db");
    const app = require("../src/app");

    connectDB.mockResolvedValue();

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    require("../src/server");

    await new Promise((resolve) => setImmediate(resolve));

    expect(connectDB).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(
      6011,
      "0.0.0.0",
      expect.any(Function)
    );
    expect(spy).toHaveBeenCalledWith(
      "ShopSphere support service running on http://localhost:6011"
    );

    spy.mockRestore();
  });

  test("logs startup failure and exits when DB connection fails", async () => {
    jest.resetModules();

    const connectDB = require("../src/config/db");
    const app = require("../src/app");

    connectDB.mockRejectedValue(new Error("db failed"));

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(() => {});

    require("../src/server");

    await new Promise((resolve) => setImmediate(resolve));

    expect(app.listen).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "Startup failed:",
      expect.any(Error)
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

