jest.mock("mongoose", () => ({
  set: jest.fn(),
  connect: jest.fn(),
  connection: {
    host: "localhost",
    name: "shopsphere",
  },
}));

const mongoose = require("mongoose");
const connectDB = require("../../src/config/db");

describe("connectDB", () => {
  const originalUri = process.env.MONGODB_URI;

  afterEach(() => {
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }

    jest.clearAllMocks();
  });

  test("throws when MONGODB_URI is not configured", async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDB()).rejects.toThrow("MONGODB_URI is not configured");

    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("connects to MongoDB", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/shopsphere";

    mongoose.connect.mockResolvedValue({});

    await connectDB();

    expect(mongoose.set).toHaveBeenCalledWith("strictQuery", true);

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/shopsphere",
    );
  });
});
