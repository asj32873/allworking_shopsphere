const controller = require("../../src/controllers/admin.controller");

const { getJson, patchJson } = require("../../src/utils/serviceClient");

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
  patchJson: jest.fn(),
}));

jest.mock("../../src/utils/apiResponse", () => ({
  ok: jest.fn((res, data, message = "OK", status = 200) => {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }),

  fail: jest.fn((res, message, status = 400) => {
    return res.status(status).json({
      success: false,
      message,
    });
  }),
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function createRequest(overrides = {}) {
  return {
    headers: {
      authorization: "Bearer test-token",
    },
    params: {},
    body: {},
    user: {
      id: "admin-123",
      role: "ADMIN",
    },
    ...overrides,
  };
}

describe("admin.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.AUTH_SERVICE_URL = "http://localhost:5002";
    process.env.VENDOR_SERVICE_URL = "http://localhost:5012";
    process.env.PRODUCT_SERVICE_URL = "http://localhost:5003";
    process.env.ORDER_SERVICE_URL = "http://localhost:5005";
    process.env.SUPPORT_SERVICE_URL = "http://localhost:5011";
    process.env.INTERNAL_SERVICE_TOKEN = "test-internal-token";
  });

  describe("dashboard", () => {
    test("returns dashboard counts from all services", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [{ id: "user-1" }, { id: "user-2" }, { id: "user-3" }],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [{ id: "vendor-1" }, { id: "vendor-2" }],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              total: 25,
            },
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              { id: "order-1" },
              { id: "order-2" },
              { id: "order-3" },
              { id: "order-4" },
            ],
          },
        });

      const req = createRequest();
      const res = createResponse();

      await controller.dashboard(req, res);

      expect(getJson).toHaveBeenCalledTimes(4);

      expect(getJson).toHaveBeenNthCalledWith(
        1,
        "http://localhost:5002",
        "/internal/admin/users",
      );

      expect(getJson).toHaveBeenNthCalledWith(
        2,
        "http://localhost:5012",
        "/internal/vendors",
      );

      expect(getJson).toHaveBeenNthCalledWith(
        3,
        "http://localhost:5003",
        "/api/products?limit=1",
      );

      expect(getJson).toHaveBeenNthCalledWith(
        4,
        "http://localhost:5005",
        "/api/orders/admin/list",
        {
          authorization: "Bearer test-token",
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          users: 3,
          vendors: 2,
          products: 25,
          orders: 4,
        },
      });
    });

    test("returns zero counts when downstream data is missing", async () => {
      getJson
        .mockResolvedValueOnce({ ok: true, data: {} })
        .mockResolvedValueOnce({ ok: true, data: {} })
        .mockResolvedValueOnce({ ok: true, data: {} })
        .mockResolvedValueOnce({ ok: true, data: {} });

      const req = createRequest();
      const res = createResponse();

      await controller.dashboard(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          users: 0,
          vendors: 0,
          products: 0,
          orders: 0,
        },
      });
    });

    test("passes authorization header to order service", async () => {
      getJson
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: { total: 0 } } })
        .mockResolvedValueOnce({ data: { data: [] } });

      const req = createRequest({
        headers: {
          authorization: "Bearer admin-token",
        },
      });

      const res = createResponse();

      await controller.dashboard(req, res);

      expect(getJson).toHaveBeenNthCalledWith(
        4,
        "http://localhost:5005",
        "/api/orders/admin/list",
        {
          authorization: "Bearer admin-token",
        },
      );
    });
  });

  describe("vendors", () => {
    test("returns vendors successfully", async () => {
      const vendors = [
        {
          _id: "vendor-1",
          userId: "user-1",
          status: "PENDING",
        },
      ];

      getJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: vendors,
        },
      });

      const req = createRequest();
      const res = createResponse();

      await controller.vendors(req, res);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5012",
        "/internal/vendors",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: vendors,
      });
    });

    test("returns downstream error when vendor service fails", async () => {
      const errorData = {
        success: false,
        message: "Vendor service unavailable",
      };

      getJson.mockResolvedValue({
        ok: false,
        status: 503,
        data: errorData,
      });

      const req = createRequest();
      const res = createResponse();

      await controller.vendors(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });

  describe("approveVendor", () => {
    test("approves vendor successfully", async () => {
      const vendor = {
        _id: "vendor-123",
        status: "VERIFIED",
      };

      patchJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: vendor,
        },
      });

      const req = createRequest({
        params: {
          id: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.approveVendor(req, res);

      expect(patchJson).toHaveBeenCalledTimes(1);

      const [url, path, body] = patchJson.mock.calls[0];

      expect(url).toBe("http://localhost:5012");
      expect(path).toBe("/internal/vendors/vendor-123");

      expect(body.status).toBe("VERIFIED");
      expect(body.verifiedAt).toBeInstanceOf(Date);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendor approved.",
        data: vendor,
      });
    });

    test("returns downstream error when approval fails", async () => {
      const errorData = {
        success: false,
        message: "Vendor update failed",
      };

      patchJson.mockResolvedValue({
        ok: false,
        status: 500,
        data: errorData,
      });

      const req = createRequest({
        params: {
          id: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.approveVendor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });

  describe("rejectVendor", () => {
    test("rejects vendor successfully", async () => {
      const vendor = {
        _id: "vendor-123",
        status: "REJECTED",
      };

      patchJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: vendor,
        },
      });

      const req = createRequest({
        params: {
          id: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.rejectVendor(req, res);

      expect(patchJson).toHaveBeenCalledTimes(1);

      const [url, path, body] = patchJson.mock.calls[0];

      expect(url).toBe("http://localhost:5012");
      expect(path).toBe("/internal/vendors/vendor-123");

      expect(body.status).toBe("REJECTED");
      expect(body.verifiedAt).toBeNull();

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendor rejected.",
        data: vendor,
      });
    });

    test("returns downstream error when rejection fails", async () => {
      const errorData = {
        success: false,
        message: "Unable to reject vendor",
      };

      patchJson.mockResolvedValue({
        ok: false,
        status: 503,
        data: errorData,
      });

      const req = createRequest({
        params: {
          id: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.rejectVendor(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });

  describe("deleteVendor", () => {
    test("deletes vendor and disables associated user", async () => {
      const vendor = {
        _id: "vendor-123",
        userId: "user-123",
      };

      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: [vendor],
        },
      });

      patchJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: {
            id: "user-123",
            status: "DISABLED",
          },
        },
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          success: true,
        }),
      });

      const req = createRequest({
        params: {
          id: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.deleteVendor(req, res);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5012",
        "/internal/vendors",
      );

      expect(patchJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/user-123",
        {
          status: "DISABLED",
        },
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5012/internal/vendors/vendor-123",
        {
          method: "DELETE",
          headers: {
            "x-internal-service-token": "test-internal-token",
          },
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendor deleted.",
        data: null,
      });
    });

    test("returns 404 when vendor does not exist", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: [],
        },
      });

      const req = createRequest({
        params: {
          id: "missing-vendor",
        },
      });

      const res = createResponse();

      await controller.deleteVendor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendor not found.",
      });

      expect(patchJson).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("does not delete vendor when vendor service returns no data", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: {},
      });

      const req = createRequest({
        params: {
          id: "missing-vendor",
        },
      });

      const res = createResponse();

      await controller.deleteVendor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(patchJson).not.toHaveBeenCalled();
    });

    test("returns vendor service delete error", async () => {
      getJson.mockResolvedValue({
        ok: true,
        data: {
          data: [
            {
              _id: "vendor-123",
              userId: "user-123",
            },
          ],
        },
      });

      patchJson.mockResolvedValue({
        ok: true,
        data: {
          data: {},
        },
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: "Delete failed",
        }),
      });

      const req = createRequest({
        params: {
          id: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.deleteVendor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Delete failed",
      });
    });
  });

  describe("users", () => {
    test("returns users successfully", async () => {
      const users = [
        {
          _id: "user-1",
          role: "USER",
          status: "ACTIVE",
        },
      ];

      getJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: users,
        },
      });

      const req = createRequest();
      const res = createResponse();

      await controller.users(req, res);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/admin/users",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: users,
      });
    });

    test("returns auth service error", async () => {
      const errorData = {
        success: false,
        message: "Auth service unavailable",
      };

      getJson.mockResolvedValue({
        ok: false,
        status: 503,
        data: errorData,
      });

      const req = createRequest();
      const res = createResponse();

      await controller.users(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });

  describe("updateUserStatus", () => {
    test("updates user status to ACTIVE", async () => {
      const updatedUser = {
        id: "user-456",
        status: "ACTIVE",
      };

      patchJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: updatedUser,
        },
      });

      const req = createRequest({
        params: {
          id: "user-456",
        },
        body: {
          status: "ACTIVE",
        },
      });

      const res = createResponse();

      await controller.updateUserStatus(req, res);

      expect(patchJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/user-456",
        {
          status: "ACTIVE",
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User status updated.",
        data: updatedUser,
      });
    });

    test("updates user status to DISABLED", async () => {
      patchJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: {
            id: "user-456",
            status: "DISABLED",
          },
        },
      });

      const req = createRequest({
        params: {
          id: "user-456",
        },
        body: {
          status: "DISABLED",
        },
      });

      const res = createResponse();

      await controller.updateUserStatus(req, res);

      expect(patchJson).toHaveBeenCalledWith(
        "http://localhost:5002",
        "/internal/users/user-456",
        {
          status: "DISABLED",
        },
      );
    });

    test("prevents admin from disabling own account", async () => {
      const req = createRequest({
        params: {
          id: "admin-123",
        },
        body: {
          status: "DISABLED",
        },
      });

      const res = createResponse();

      await controller.updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You cannot disable your own admin account.",
      });

      expect(patchJson).not.toHaveBeenCalled();
    });

    test("rejects invalid user status", async () => {
      const req = createRequest({
        params: {
          id: "user-456",
        },
        body: {
          status: "PENDING",
        },
      });

      const res = createResponse();

      await controller.updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid user status.",
      });

      expect(patchJson).not.toHaveBeenCalled();
    });

    test("returns downstream error", async () => {
      const errorData = {
        success: false,
        message: "User service failed",
      };

      patchJson.mockResolvedValue({
        ok: false,
        status: 503,
        data: errorData,
      });

      const req = createRequest({
        params: {
          id: "user-456",
        },
        body: {
          status: "DISABLED",
        },
      });

      const res = createResponse();

      await controller.updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });

  describe("issues", () => {
    test("returns issues successfully", async () => {
      const issues = [
        {
          id: "issue-1",
          title: "Vendor issue",
        },
      ];

      getJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: issues,
        },
      });

      const req = createRequest();
      const res = createResponse();

      await controller.issues(req, res);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5011",
        "/api/issues",
        {
          authorization: "Bearer test-token",
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: issues,
      });
    });

    test("returns support service error", async () => {
      const errorData = {
        success: false,
        message: "Support service unavailable",
      };

      getJson.mockResolvedValue({
        ok: false,
        status: 503,
        data: errorData,
      });

      const req = createRequest();
      const res = createResponse();

      await controller.issues(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });

  describe("orders", () => {
    test("returns orders successfully", async () => {
      const orders = [
        {
          id: "order-1",
          total: 100,
        },
      ];

      getJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: orders,
        },
      });

      const req = createRequest();
      const res = createResponse();

      await controller.orders(req, res);

      expect(getJson).toHaveBeenCalledWith(
        "http://localhost:5005",
        "/api/orders/admin/list",
        {
          authorization: "Bearer test-token",
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: orders,
      });
    });

    test("returns order service error", async () => {
      const errorData = {
        success: false,
        message: "Order service unavailable",
      };

      getJson.mockResolvedValue({
        ok: false,
        status: 503,
        data: errorData,
      });

      const req = createRequest();
      const res = createResponse();

      await controller.orders(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });

  describe("assignVendor", () => {
    test("assigns vendor to issue successfully", async () => {
      const issue = {
        id: "issue-123",
        vendorId: "vendor-123",
      };

      patchJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: issue,
        },
      });

      const req = createRequest({
        params: {
          id: "issue-123",
        },
        body: {
          vendorId: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.assignVendor(req, res);

      expect(patchJson).toHaveBeenCalledWith(
        "http://localhost:5011",
        "/api/issues/issue-123/assign",
        {
          vendorId: "vendor-123",
        },
        {
          authorization: "Bearer test-token",
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendor assigned successfully.",
        data: issue,
      });
    });

    test("returns 400 when vendorId is missing", async () => {
      const req = createRequest({
        params: {
          id: "issue-123",
        },
        body: {},
      });

      const res = createResponse();

      await controller.assignVendor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendor ID is required.",
      });

      expect(patchJson).not.toHaveBeenCalled();
    });

    test("returns downstream error when assignment fails", async () => {
      const errorData = {
        success: false,
        message: "Assignment failed",
      };

      patchJson.mockResolvedValue({
        ok: false,
        status: 400,
        data: errorData,
      });

      const req = createRequest({
        params: {
          id: "issue-123",
        },
        body: {
          vendorId: "vendor-123",
        },
      });

      const res = createResponse();

      await controller.assignVendor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(errorData);
    });
  });
});
