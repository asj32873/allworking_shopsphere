const {
  createIssueSchema,
  updateIssueSchema,
} = require("../../src/validators/issue");

const id = "507f1f77bcf86cd799439011";

describe("issue validators", () => {
  test("create schema accepts valid issue and defaults priority", () => {
    const result = createIssueSchema.safeParse({
      subject: "  Broken product  ",
      description: "  It arrived damaged  ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      subject: "Broken product",
      description: "It arrived damaged",
      priority: "MEDIUM",
    });
  });

  test("create schema accepts valid optional ObjectIds and priority", () => {
    const result = createIssueSchema.parse({
      orderId: id,
      productId: id.toUpperCase(),
      subject: "Problem",
      description: "Details",
      priority: "URGENT",
    });

    expect(result.orderId).toBe(id);
    expect(result.productId).toBe(id.toUpperCase());
    expect(result.priority).toBe("URGENT");
  });

  test("create schema converts empty ids to undefined", () => {
    const result = createIssueSchema.parse({
      orderId: "",
      productId: "",
      subject: "Problem",
      description: "Details",
    });

    expect(result.orderId).toBeUndefined();
    expect(result.productId).toBeUndefined();
  });

  test("create schema rejects invalid ids", () => {
    const result = createIssueSchema.safeParse({
      orderId: "not-an-id",
      subject: "Problem",
      description: "Details",
    });

    expect(result.success).toBe(false);
  });

  test("create schema rejects short subject", () => {
    const result = createIssueSchema.safeParse({
      subject: "x",
      description: "Details",
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects short description", () => {
    const result = createIssueSchema.safeParse({
      subject: "Problem",
      description: "x",
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects invalid priority", () => {
    const result = createIssueSchema.safeParse({
      subject: "Problem",
      description: "Details",
      priority: "CRITICAL",
    });
    expect(result.success).toBe(false);
  });

  test("update schema accepts all supported fields", () => {
    const result = updateIssueSchema.parse({
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedTo: id,
      response: "We are looking into this.",
    });

    expect(result).toEqual({
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedTo: id,
      response: "We are looking into this.",
    });
  });

  test("update schema converts empty assignedTo to undefined", () => {
    const result = updateIssueSchema.parse({
      assignedTo: "",
    });
    expect(result.assignedTo).toBeUndefined();
  });

  test("update schema rejects invalid enum values and ids", () => {
    expect(
      updateIssueSchema.safeParse({ status: "BAD" }).success
    ).toBe(false);

    expect(
      updateIssueSchema.safeParse({ priority: "BAD" }).success
    ).toBe(false);

    expect(
      updateIssueSchema.safeParse({ assignedTo: "bad-id" }).success
    ).toBe(false);
  });
});

