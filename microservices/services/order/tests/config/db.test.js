const mongoose = require("mongoose");

jest.mock("mongoose", () => ({
  set: jest.fn(),
  connect: jest.fn(),

  connection: {
    host: "localhost",
    name: "shopsphere-test",
  },
}));

const connectDB = require("../../src/config/db");

describe("order db", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONGODB_URI;
  });

  test("throws when MONGODB_URI is not configured", async () => {
    await expect(connectDB()).rejects.toThrow(
      "MONGODB_URI is not configured",
    );

    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("configures strictQuery and connects to MongoDB", async () => {
    process.env.MONGODB_URI =
      "mongodb://localhost:27017/shopsphere-test";

    mongoose.connect.mockResolvedValue({});

    await connectDB();

    expect(mongoose.set).toHaveBeenCalledWith(
      "strictQuery",
      true,
    );

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/shopsphere-test",
    );
  });
});