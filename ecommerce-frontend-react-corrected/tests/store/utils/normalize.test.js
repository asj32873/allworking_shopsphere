import {
  normalizeProduct,
  normalizeUser,
  normalizeVendor,
  normalizeAddress,
  normalizeReview,
  normalizeOrder,
  normalizeIssue,
} from "../../../src/store/utils/normalize";

describe("normalize utilities", () => {
  describe("normalizeProduct", () => {
    test("normalizes product with _id and imageUrl", () => {
      const input = {
        _id: "prod-1",
        name: "Wireless Mouse",
        imageUrl: "https://example.com/mouse.jpg",
        vendor: {
          _id: "vend-1",
          name: "TechStore",
          userId: { _id: "user-9" },
        },
      };

      const result = normalizeProduct(input);

      expect(result.id).toBe("prod-1");
      expect(result.image).toBe("https://example.com/mouse.jpg");
      expect(result.vendor.id).toBe("vend-1");
      expect(result.vendor.userId).toBe("user-9");
    });

    test("falls back to id and image when _id and imageUrl are not present", () => {
      const input = {
        id: "prod-2",
        name: "Keyboard",
        image: "https://example.com/kb.jpg",
        vendor: null,
      };

      const result = normalizeProduct(input);

      expect(result.id).toBe("prod-2");
      expect(result.image).toBe("https://example.com/kb.jpg");
      expect(result.vendor).toBeNull();
    });

    test("handles vendor with plain userId string", () => {
      const input = {
        _id: "prod-3",
        vendor: {
          id: "vend-2",
          userId: "user-10",
        },
      };

      const result = normalizeProduct(input);

      expect(result.vendor.id).toBe("vend-2");
      expect(result.vendor.userId).toBe("user-10");
    });
  });

  describe("normalizeUser", () => {
    test("sets id from _id", () => {
      const input = { _id: "usr-1", name: "Alice", email: "alice@test.com" };
      const result = normalizeUser(input);

      expect(result.id).toBe("usr-1");
      expect(result.name).toBe("Alice");
    });

    test("preserves id if already set", () => {
      const input = { id: "usr-2", name: "Bob" };
      const result = normalizeUser(input);

      expect(result.id).toBe("usr-2");
    });
  });

  describe("normalizeVendor", () => {
    test("normalizes vendor with nested userId object", () => {
      const input = {
        _id: "vend-10",
        storeName: "SuperStore",
        userId: { _id: "usr-88" },
      };

      const result = normalizeVendor(input);

      expect(result.id).toBe("vend-10");
      expect(result.userId).toBe("usr-88");
      expect(result.storeName).toBe("SuperStore");
    });

    test("normalizes vendor with plain userId", () => {
      const input = {
        id: "vend-11",
        storeName: "MegaStore",
        userId: "usr-89",
      };

      const result = normalizeVendor(input);

      expect(result.id).toBe("vend-11");
      expect(result.userId).toBe("usr-89");
    });
  });

  describe("normalizeAddress", () => {
    test("normalizes address with _id", () => {
      const input = {
        _id: "addr-1",
        street: "123 Main St",
        city: "Cityville",
        state: "State",
        pincode: "123456",
        isDefault: true,
      };

      const result = normalizeAddress(input);

      expect(result.id).toBe("addr-1");
      expect(result.street).toBe("123 Main St");
      expect(result.isDefault).toBe(true);
    });
  });

  describe("normalizeReview", () => {
    test("normalizes review with populated productId and userId", () => {
      const input = {
        _id: "rev-1",
        rating: 5,
        comment: "Excellent!",
        productId: { _id: "prod-100" },
        userId: { _id: "usr-200", name: "John Doe" },
      };

      const result = normalizeReview(input);

      expect(result.id).toBe("rev-1");
      expect(result.productId).toBe("prod-100");
      expect(result.userId).toBe("usr-200");
      expect(result.user).toEqual({
        id: "usr-200",
        name: "John Doe",
      });
    });

    test("normalizes review with plain IDs and no user name", () => {
      const input = {
        id: "rev-2",
        rating: 4,
        productId: "prod-101",
        userId: "usr-201",
      };

      const result = normalizeReview(input);

      expect(result.id).toBe("rev-2");
      expect(result.productId).toBe("prod-101");
      expect(result.userId).toBe("usr-201");
      expect(result.user).toBeNull();
    });
  });

  describe("normalizeOrder", () => {
    test("normalizes order and nested items", () => {
      const input = {
        _id: "ord-1",
        userId: { _id: "usr-1" },
        addressId: { _id: "addr-1" },
        items: [
          {
            _id: "item-1",
            orderId: { _id: "ord-1" },
            productId: { _id: "prod-1" },
            vendorId: { _id: "vend-1" },
            tracking: [{ status: "PLACED", timestamp: "2026-01-01" }],
          },
        ],
      };

      const result = normalizeOrder(input);

      expect(result.id).toBe("ord-1");
      expect(result.userId).toBe("usr-1");
      expect(result.addressId).toBe("addr-1");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("item-1");
      expect(result.items[0].productId).toBe("prod-1");
      expect(result.items[0].vendorId).toBe("vend-1");
      expect(result.items[0].tracking).toHaveLength(1);
    });

    test("handles empty items array gracefully", () => {
      const input = {
        id: "ord-2",
        userId: "usr-2",
        addressId: "addr-2",
      };

      const result = normalizeOrder(input);

      expect(result.id).toBe("ord-2");
      expect(result.items).toEqual([]);
    });
  });

  describe("normalizeIssue", () => {
    test("normalizes issue with nested object references", () => {
      const input = {
        _id: "issue-1",
        userId: { _id: "usr-1" },
        assignedTo: { _id: "adm-1" },
        orderId: { _id: "ord-1" },
        productId: { _id: "prod-1" },
        subject: "Damaged product",
      };

      const result = normalizeIssue(input);

      expect(result.id).toBe("issue-1");
      expect(result.userId).toBe("usr-1");
      expect(result.assignedTo).toBe("adm-1");
      expect(result.orderId).toBe("ord-1");
      expect(result.productId).toBe("prod-1");
    });

    test("defaults missing relations to null", () => {
      const input = {
        id: "issue-2",
        userId: "usr-2",
        subject: "General query",
      };

      const result = normalizeIssue(input);

      expect(result.id).toBe("issue-2");
      expect(result.assignedTo).toBeNull();
      expect(result.orderId).toBeNull();
      expect(result.productId).toBeNull();
    });
  });
});
