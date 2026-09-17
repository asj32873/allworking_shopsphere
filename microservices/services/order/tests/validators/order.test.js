const {
  createOrderSchema,
  statusSchema,
} = require("../../src/validators/order");

describe("order validators", () => {
  describe("createOrderSchema", () => {
    test("accepts valid order request", () => {
      const result = createOrderSchema.safeParse({
        addressId: "address-123",
      });

      expect(result.success).toBe(true);
    });

    test("accepts paymentMethod", () => {
      const result = createOrderSchema.safeParse({
        addressId: "address-123",
        paymentMethod: "STRIPE_TEST",
      });

      expect(result.success).toBe(true);
    });

    test("rejects missing addressId", () => {
      const result = createOrderSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test("rejects empty addressId", () => {
      const result = createOrderSchema.safeParse({
        addressId: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("statusSchema", () => {
    const statuses = [
      "PLACED",
      "CONFIRMED",
      "PACKED",
      "DISPATCHED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];

    test.each(statuses)(
      "accepts status %s",
      (status) => {
        const result = statusSchema.safeParse({
          status,
        });

        expect(result.success).toBe(true);
      },
    );

    test("accepts remarks", () => {
      const result = statusSchema.safeParse({
        status: "CONFIRMED",
        remarks: "Packed successfully",
      });

      expect(result.success).toBe(true);
    });

    test("rejects invalid status", () => {
      const result = statusSchema.safeParse({
        status: "INVALID_STATUS",
      });

      expect(result.success).toBe(false);
    });

    test("rejects missing status", () => {
      const result = statusSchema.safeParse({
        remarks: "test",
      });

      expect(result.success).toBe(false);
    });
  });
});