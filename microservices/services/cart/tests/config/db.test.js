const mongoose = require("mongoose");

jest.mock("mongoose", () => ({
  set: jest.fn(),
  connect: jest.fn(),
  connection: {
    host: "localhost",
    name: "shopsphere_test",
  },
}));

const connectDB = require("../../src/config/db");

describe("connectDB", () => {
  const originalUri = process.env.MONGODB_URI;

  afterEach(() => {
    jest.clearAllMocks();

    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  });

  test("throws when MONGODB_URI is not configured", async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDB()).rejects.toThrow("MONGODB_URI is not configured");

    expect(mongoose.set).not.toHaveBeenCalled();
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("connects to MongoDB using MONGODB_URI", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/shopsphere_test";

    mongoose.connect.mockResolvedValueOnce({});

    await connectDB();

    expect(mongoose.set).toHaveBeenCalledWith("strictQuery", true);

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/shopsphere_test",
    );
  });

  test("propagates MongoDB connection errors", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/shopsphere_test";

    const error = new Error("MongoDB connection failed");

    mongoose.connect.mockRejectedValueOnce(error);

    await expect(connectDB()).rejects.toThrow("MongoDB connection failed");

    expect(mongoose.set).toHaveBeenCalledWith("strictQuery", true);
  });
});
