const mongoose = require("mongoose");
const User = require("../../src/models/User");

describe("User model", () => {
  test("creates a User model", () => {
    expect(User).toBeDefined();
    expect(User.modelName).toBe("User");
  });

  test("has required fields", () => {
    const schema = User.schema;

    expect(schema.path("name").isRequired).toBe(true);
    expect(schema.path("email").isRequired).toBe(true);
  });

  test("uses String for email and enables lowercase/trim", () => {
    const path = User.schema.path("email");

    expect(path.instance).toBe("String");
    expect(path.options.lowercase).toBe(true);
    expect(path.options.trim).toBe(true);
  });

  test("does not select passwordHash by default", () => {
    expect(User.schema.path("passwordHash").options.select).toBe(false);
  });

  test("supports USER, VENDOR and ADMIN roles", () => {
    expect(User.schema.path("role").enumValues).toEqual([
      "USER",
      "VENDOR",
      "ADMIN",
    ]);
  });

  test("defaults role to USER", () => {
    const user = new User({
      name: "Test User",
      email: "test@example.com",
    });

    expect(user.role).toBe("USER");
  });

  test("defaults status to ACTIVE", () => {
    const user = new User({
      name: "Test User",
      email: "test@example.com",
    });

    expect(user.status).toBe("ACTIVE");
  });

  test("supports ACTIVE and DISABLED statuses", () => {
    expect(User.schema.path("status").enumValues).toEqual([
      "ACTIVE",
      "DISABLED",
    ]);
  });

  test("uses String for auth0Sub and makes it sparse/unique", () => {
    const path = User.schema.path("auth0Sub");

    expect(path.instance).toBe("String");
    expect(path.options.unique).toBe(true);
    expect(path.options.sparse).toBe(true);
  });

  test("trims string fields", () => {
    const user = new User({
      name: "  Test User  ",
      email: "  TEST@EXAMPLE.COM  ",
      phone: " 9999999999 ",
    });

    expect(user.name).toBe("Test User");
    expect(user.email).toBe("test@example.com");
    expect(user.phone).toBe("9999999999");
  });

  test("has timestamps enabled", () => {
    expect(User.schema.options.timestamps).toBe(true);
  });

  test("has indexes for email, auth0Sub, role and status", () => {
    const indexes = User.schema.indexes();

    expect(indexes.some(([fields]) => fields.email === 1)).toBe(true);
    expect(indexes.some(([fields]) => fields.auth0Sub === 1)).toBe(true);
    expect(indexes.some(([fields]) => fields.role === 1)).toBe(true);
    expect(indexes.some(([fields]) => fields.status === 1)).toBe(true);
  });

  test("accepts a complete valid user", () => {
    const user = new User({
      name: "Test User",
      email: "test@example.com",
      phone: "9999999999",
      passwordHash: "hashed-password",
      auth0Sub: "auth0|abc123",
      role: "USER",
      status: "ACTIVE",
    });

    expect(user.validateSync()).toBeUndefined();
  });

  test("rejects an invalid role", () => {
    const user = new User({
      name: "Test User",
      email: "test@example.com",
      role: "INVALID",
    });

    const error = user.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.role).toBeDefined();
  });

  test("rejects an invalid status", () => {
    const user = new User({
      name: "Test User",
      email: "test@example.com",
      status: "INVALID",
    });

    const error = user.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });

  test("rejects missing required fields", () => {
    const user = new User({});
    const error = user.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });
});
