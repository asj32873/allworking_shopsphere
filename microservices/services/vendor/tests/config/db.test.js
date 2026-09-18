jest.mock("mongoose", () => ({
  set: jest.fn(),
  connect: jest.fn(),
  connection: { host: "localhost", name: "shopsphere" },
}));
const mongoose = require("mongoose");
const connectDB = require("../../src/config/db");

describe("db config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONGODB_URI;
  });
  test("throws when MONGODB_URI is missing", async () => {
    await expect(connectDB()).rejects.toThrow("MONGODB_URI is not configured");
    expect(mongoose.connect).not.toHaveBeenCalled();
  });
  test("configures strictQuery and connects", async () => {
    process.env.MONGODB_URI = "mongodb://example/db";
    await connectDB();
    expect(mongoose.set).toHaveBeenCalledWith("strictQuery", true);
    expect(mongoose.connect).toHaveBeenCalledWith("mongodb://example/db");
  });
});

