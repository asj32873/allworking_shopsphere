const {
  registerSchema,
  vendorRegisterSchema,
  loginSchema,
  auth0LoginSchema,
} = require("../../src/validators/auth");

describe("auth validators", () => {
  describe("registerSchema", () => {
    test("accepts a valid registration", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        phone: "9999999999",
        password: "secret123",
      });

      expect(result.success).toBe(true);
    });

    test("allows phone to be omitted", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "secret123",
      });

      expect(result.success).toBe(true);
    });

    test("rejects short name", () => {
      const result = registerSchema.safeParse({
        name: "A",
        email: "test@example.com",
        password: "secret123",
      });

      expect(result.success).toBe(false);
    });

    test("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "not-an-email",
        password: "secret123",
      });

      expect(result.success).toBe(false);
    });

    test("rejects password shorter than 6 characters", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "12345",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("vendorRegisterSchema", () => {
    const validVendor = {
      ownerName: "Vendor Owner",
      storeName: "Test Store",
      email: "vendor@example.com",
      phone: "9999999999",
      storeAddress: "123 Main Street, Bengaluru",
      password: "secret123",
    };

    test("accepts a valid vendor registration", () => {
      expect(vendorRegisterSchema.safeParse(validVendor).success).toBe(true);
    });

    test("requires storeAddress", () => {
      const { storeAddress, ...invalid } = validVendor;
      expect(vendorRegisterSchema.safeParse(invalid).success).toBe(false);
    });

    test("rejects short store name", () => {
      expect(
        vendorRegisterSchema.safeParse({
          ...validVendor,
          storeName: "A",
        }).success,
      ).toBe(false);
    });
  });

  describe("loginSchema", () => {
    test("accepts valid credentials", () => {
      expect(
        loginSchema.safeParse({
          email: "test@example.com",
          password: "secret123",
        }).success,
      ).toBe(true);
    });

    test("rejects invalid email", () => {
      expect(
        loginSchema.safeParse({
          email: "invalid",
          password: "secret123",
        }).success,
      ).toBe(false);
    });

    test("rejects empty password", () => {
      expect(
        loginSchema.safeParse({
          email: "test@example.com",
          password: "",
        }).success,
      ).toBe(false);
    });
  });

  describe("auth0LoginSchema", () => {
    test("accepts a token", () => {
      expect(
        auth0LoginSchema.safeParse({ token: "auth0-access-token" }).success,
      ).toBe(true);
    });

    test("rejects an empty token", () => {
      expect(
        auth0LoginSchema.safeParse({ token: "" }).success,
      ).toBe(false);
    });

    test("rejects a missing token", () => {
      expect(auth0LoginSchema.safeParse({}).success).toBe(false);
    });
  });
});
