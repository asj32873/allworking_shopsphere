const mockGetJson = jest.fn();

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: mockGetJson,
}));

const {
  getVendorByUserId,
  getAllVendors,
} = require("../../src/services/vendor.service");

describe("vendor service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getVendorByUserId", () => {
    test("returns null when userId is missing", async () => {
      await expect(getVendorByUserId()).resolves.toBeNull();

      expect(mockGetJson).not.toHaveBeenCalled();
    });

    test("gets vendor by user id", async () => {
      const vendor = {
        id: "vendor-1",
        userId: "user-1",
        name: "Test Vendor",
      };

      mockGetJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: vendor,
        },
      });

      await expect(
        getVendorByUserId("user-1")
      ).resolves.toEqual(vendor);

      expect(mockGetJson).toHaveBeenCalledWith(
        "http://localhost:5012",
        "/internal/vendors/by-user/user-1"
      );
    });

    test("encodes user id", async () => {
      mockGetJson.mockResolvedValue({
        ok: true,
        data: {
          data: {
            id: "vendor-1",
          },
        },
      });

      await getVendorByUserId("user/123");

      expect(mockGetJson).toHaveBeenCalledWith(
        "http://localhost:5012",
        "/internal/vendors/by-user/user%2F123"
      );
    });

    test("returns null when vendor service returns failure", async () => {
      mockGetJson.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        getVendorByUserId("user-1")
      ).resolves.toBeNull();
    });

    test("returns null when request throws", async () => {
      mockGetJson.mockRejectedValue(
        new Error("Service unavailable")
      );

      await expect(
        getVendorByUserId("user-1")
      ).resolves.toBeNull();
    });

    test("returns null when response data is missing", async () => {
      mockGetJson.mockResolvedValue({
        ok: true,
        data: {},
      });

      await expect(
        getVendorByUserId("user-1")
      ).resolves.toBeNull();
    });
  });

  describe("getAllVendors", () => {
    test("returns vendor array", async () => {
      const vendors = [
        {
          id: "vendor-1",
          userId: "user-1",
        },
        {
          id: "vendor-2",
          userId: "user-2",
        },
      ];

      mockGetJson.mockResolvedValue({
        ok: true,
        data: {
          data: vendors,
        },
      });

      await expect(
        getAllVendors()
      ).resolves.toEqual(vendors);

      expect(mockGetJson).toHaveBeenCalledWith(
        "http://localhost:5012",
        "/internal/vendors"
      );
    });

    test("returns empty array on failure", async () => {
      mockGetJson.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        getAllVendors()
      ).resolves.toEqual([]);
    });

    test("returns empty array when response data is not array", async () => {
      mockGetJson.mockResolvedValue({
        ok: true,
        data: {
          data: {},
        },
      });

      await expect(
        getAllVendors()
      ).resolves.toEqual([]);
    });

    test("returns empty array when request throws", async () => {
      mockGetJson.mockRejectedValue(
        new Error("Vendor service unavailable")
      );

      await expect(
        getAllVendors()
      ).resolves.toEqual([]);
    });
  });
});