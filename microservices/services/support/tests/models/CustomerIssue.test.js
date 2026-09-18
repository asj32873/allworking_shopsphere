jest.mock("mongoose", () => {
  const Schema = function(definition, options) {
    this.definition = definition;
    this.options = options;
  };
  Schema.Types = { ObjectId: function ObjectId() {} };
  return {
    Schema,
    model: jest.fn((name, schema) => ({ name, schema })),
  };
});

describe("CustomerIssue model", () => {
  test("defines fields, enums, defaults, indexes and timestamps", () => {
    jest.resetModules();
    const mongoose = require("mongoose");
    const model = require("../../src/models/CustomerIssue");
    const d = model.schema.definition;

    expect(model.name).toBe("CustomerIssue");

    expect(d.userId.required).toBe(true);
    expect(d.userId.index).toBe(true);

    expect(d.orderId.default).toBe(null);
    expect(d.orderId.index).toBe(true);

    expect(d.productId.default).toBe(null);
    expect(d.productId.index).toBe(true);

    expect(d.subject.required).toBe(true);
    expect(d.subject.trim).toBe(true);
    expect(d.description.required).toBe(true);
    expect(d.description.trim).toBe(true);

    expect(d.status.enum).toEqual([
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ]);
    expect(d.status.default).toBe("OPEN");
    expect(d.status.index).toBe(true);

    expect(d.priority.enum).toEqual([
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ]);
    expect(d.priority.default).toBe("MEDIUM");
    expect(d.priority.index).toBe(true);

    expect(d.assignedTo.default).toBe(null);
    expect(d.response).toBe(String);
    expect(d.resolvedAt).toBe(Date);

    expect(model.schema.options.timestamps).toBe(true);
    expect(mongoose.model).toHaveBeenCalledWith(
      "CustomerIssue",
      model.schema
    );
  });
});

