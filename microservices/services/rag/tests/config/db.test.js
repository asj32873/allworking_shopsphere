const mongoose = require("mongoose");
const connectDB = require("../../src/config/db");

jest.mock("mongoose", () => ({
  set: jest.fn(),
  connect: jest.fn(),
  connection: {
    host: "localhost",
    name: "shopsphere",
  },
}));

describe("Database Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("should throw error when MONGODB_URI is not configured", async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDB()).rejects.toThrow(
      "MONGODB_URI is not configured"
    );

    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("should configure strictQuery and connect to MongoDB", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/shopsphere";

    mongoose.connect.mockResolvedValue({
      connection: mongoose.connection,
    });

    await connectDB();

    expect(mongoose.set).toHaveBeenCalledWith(
      "strictQuery",
      true
    );

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/shopsphere"
    );
  });

  test("should propagate MongoDB connection errors", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/shopsphere";

    mongoose.connect.mockRejectedValue(
      new Error("MongoDB connection failed")
    );

    await expect(connectDB()).rejects.toThrow(
      "MongoDB connection failed"
    );
  });
});