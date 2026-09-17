jest.mock("mongoose", () => {
  const Schema = function(definition, options) {
    this.definition = definition;
    this.options = options;
    this.index = jest.fn();
  };
  Schema.Types = { ObjectId: function ObjectId() {} };
  return {
    Schema,
    model: jest.fn((name, schema) => ({ name, schema })),
  };
});

describe("Vendor model", () => {
  test("defines required fields, enum/default values, timestamps and indexes", () => {
    jest.resetModules();
    const mongoose = require("mongoose");
    const model = require("../../models/Vendor");

    const schema = model.schema;
    const d = schema.definition;

    expect(model.name).toBe("Vendor");
    expect(d.userId.required).toBe(true);
    expect(d.storeName.required).toBe(true);
    expect(d.storeName.trim).toBe(true);
    expect(d.email.required).toBe(true);
    expect(d.email.lowercase).toBe(true);
    expect(d.email.trim).toBe(true);
    expect(d.storeAddress.required).toBe(true);
    expect(d.status.enum).toEqual([
      "APPLIED",
      "VERIFIED",
      "REJECTED",
      "UNVERIFIED",
    ]);
    expect(d.status.default).toBe("APPLIED");
    expect(schema.options.timestamps).toBe(true);
    expect(schema.index).toHaveBeenCalledWith({ userId: 1 }, { unique: true });
    expect(mongoose.model).toHaveBeenCalledWith("Vendor", schema);
  });
});
