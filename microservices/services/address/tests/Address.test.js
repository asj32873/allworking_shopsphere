// tests/models/Address.test.js

const mongoose = require("mongoose");
const Address = require("../src/models/Address");

describe("Address model", () => {
  test("creates an Address model", () => {
    expect(Address).toBeDefined();
    expect(Address.modelName).toBe("Address");
  });

  test("has required fields", () => {
    const schema = Address.schema;

    expect(schema.path("userId").isRequired).toBe(true);
    expect(schema.path("addressLine").isRequired).toBe(true);
    expect(schema.path("city").isRequired).toBe(true);
    expect(schema.path("state").isRequired).toBe(true);
    expect(schema.path("pincode").isRequired).toBe(true);
  });

  test("uses ObjectId for userId", () => {
    expect(Address.schema.path("userId").instance).toBe("ObjectId");
  });

  test("has valid address types", () => {
    const typePath = Address.schema.path("type");

    expect(typePath.enumValues).toEqual(["Home", "Office", "Other"]);
  });

  test("defaults type to Home", () => {
    const address = new Address({
      userId: new mongoose.Types.ObjectId(),
      addressLine: "123 Main Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    });

    expect(address.type).toBe("Home");
  });

  test("defaults isDefault to false", () => {
    const address = new Address({
      userId: new mongoose.Types.ObjectId(),
      addressLine: "123 Main Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    });

    expect(address.isDefault).toBe(false);
  });

  test("supports Office address type", () => {
    const address = new Address({
      userId: new mongoose.Types.ObjectId(),
      type: "Office",
      addressLine: "Office Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    });

    expect(address.type).toBe("Office");
  });

  test("supports Other address type", () => {
    const address = new Address({
      userId: new mongoose.Types.ObjectId(),
      type: "Other",
      addressLine: "Other Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    });

    expect(address.type).toBe("Other");
  });

  test("trims string fields", () => {
    const address = new Address({
      userId: new mongoose.Types.ObjectId(),
      addressLine: "  123 Main Street  ",
      city: "  Bengaluru  ",
      state: "  Karnataka  ",
      pincode: " 560001 ",
    });

    expect(address.addressLine).toBe("123 Main Street");
    expect(address.city).toBe("Bengaluru");
    expect(address.state).toBe("Karnataka");
    expect(address.pincode).toBe("560001");
  });

  test("has timestamps enabled", () => {
    expect(Address.schema.options.timestamps).toBe(true);
  });

  test("has userId index", () => {
    const indexes = Address.schema.indexes();

    expect(indexes.some(([fields]) => fields.userId === 1)).toBe(true);
  });

  test("has compound userId and isDefault index", () => {
    const indexes = Address.schema.indexes();

    expect(
      indexes.some(([fields]) => fields.userId === 1 && fields.isDefault === 1),
    ).toBe(true);
  });

  test("rejects an invalid address type", () => {
    const address = new Address({
      userId: new mongoose.Types.ObjectId(),
      type: "INVALID",
      addressLine: "123 Main Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    });

    const error = address.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  test("rejects missing required fields", () => {
    const address = new Address({});

    const error = address.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.userId).toBeDefined();
    expect(error.errors.addressLine).toBeDefined();
    expect(error.errors.city).toBeDefined();
    expect(error.errors.state).toBeDefined();
    expect(error.errors.pincode).toBeDefined();
  });

  test("accepts a complete valid address", () => {
    const address = new Address({
      userId: new mongoose.Types.ObjectId(),
      type: "Home",
      addressLine: "123 Main Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      isDefault: true,
    });

    const error = address.validateSync();

    expect(error).toBeUndefined();
    expect(address.isDefault).toBe(true);
  });
});
