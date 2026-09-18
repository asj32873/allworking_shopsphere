jest.mock("../src/config/db", () => jest.fn());
jest.mock("../src/app", () => ({
  listen: jest.fn((port, host, cb) => { cb(); return { close: jest.fn() }; }),
}));
const connectDB = require("../src/config/db");
const app = require("../src/app");

describe("vendor server startup", () => {
  let exitSpy, logSpy, errorSpy;
  beforeEach(() => {
    jest.resetModules();
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    exitSpy.mockRestore(); logSpy.mockRestore(); errorSpy.mockRestore();
  });

  test("connects to DB and listens on configured port", async () => {
    jest.doMock("../src/config/db", () => jest.fn().mockResolvedValue(undefined));
    const listen = jest.fn((port, host, cb) => cb());
    jest.doMock("../src/app", () => ({ listen }));
    process.env.PORT = "6012";
    require("../src/server");
    await new Promise(setImmediate);
    expect(listen).toHaveBeenCalledWith(6012, "0.0.0.0", expect.any(Function));
    expect(console.log).toHaveBeenCalledWith("ShopSphere vendor service running on http://localhost:6012");
  });

  test("logs startup failure and exits when DB connection fails", async () => {
    jest.doMock("../src/config/db", () => jest.fn().mockRejectedValue(new Error("db down")));
    jest.doMock("../src/app", () => ({ listen: jest.fn() }));
    require("../src/server");
    await new Promise(setImmediate);
    expect(console.error).toHaveBeenCalledWith("Startup failed:", expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

