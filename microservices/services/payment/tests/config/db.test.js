jest.mock("mongoose", () => ({
  set: jest.fn(),
  connect: jest.fn(),
  connection: {
    host: "localhost",
    name: "test",
  },
}));

const mongoose = require("mongoose");
const connectDB = require("../../src/config/db");

describe("db", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
    };

    delete process.env.MONGODB_URI;

    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("throws when MONGODB_URI is missing", async () => {
    await expect(connectDB()).rejects.toThrow(
      "MONGODB_URI is not configured",
    );

    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("connects to MongoDB", async () => {
    process.env.MONGODB_URI = "mongodb://localhost/payment-test";

    mongoose.connect.mockResolvedValueOnce({});

    await connectDB();

    expect(mongoose.set).toHaveBeenCalledWith(
      "strictQuery",
      true,
    );

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost/payment-test",
    );
  });

  test("propagates MongoDB connection error", async () => {
    process.env.MONGODB_URI = "mongodb://localhost/payment-test";

    mongoose.connect.mockRejectedValueOnce(
      new Error("connection failed"),
    );

    await expect(connectDB()).rejects.toThrow(
      "connection failed",
    );
  });
});

// jest.mock("mongoose",()=>({set:jest.fn(),connect:jest.fn(),connection:{host:"localhost",name:"test"}}));
// describe("db",()=>{const mongoose=require("mongoose");const old=process.env;beforeEach(()=>{process.env={...old};jest.resetModules();jest.clearAllMocks()});afterAll(()=>process.env=old);test("missing URI",async()=>{delete process.env.MONGODB_URI;const c=require("../../src/config/db");await expect(c()).rejects.toThrow("MONGODB_URI is not configured")});test("connects",async()=>{process.env.MONGODB_URI="mongodb://test";const c=require("../../src/config/db");await c();expect(mongoose.set).toHaveBeenCalledWith("strictQuery",true);expect(mongoose.connect).toHaveBeenCalledWith("mongodb://test")});test("propagates error",async()=>{process.env.MONGODB_URI="x";mongoose.connect.mockRejectedValueOnce(new Error("db down"));const c=require("../../src/config/db");await expect(c()).rejects.toThrow("db down")})});
