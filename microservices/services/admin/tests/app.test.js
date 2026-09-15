const request = require("supertest");

jest.mock("../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: "admin-123",
      role: "ADMIN",
    };

    next();
  }),

  authorize: jest.fn(() => (req, res, next) => {
    next();
  }),
}));

jest.mock("../src/controllers/admin.controller", () => ({
  dashboard: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: {},
    }),
  ),

  vendors: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
    }),
  ),

  approveVendor: jest.fn(),
  rejectVendor: jest.fn(),
  deleteVendor: jest.fn(),

  users: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
    }),
  ),

  updateUserStatus: jest.fn(),

  orders: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
    }),
  ),

  issues: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
    }),
  ),

  assignVendor: jest.fn(),
}));

jest.mock("@shopsphere/common", () => ({
  requestId: jest.fn((req, res, next) => {
    req.requestId = "test-request-id";
    next();
  }),

  notFound: jest.fn((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found.",
    });
  }),

  errorHandler: jest.fn((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }),
}));

const app = require("../src/app");

describe("admin app", () => {
  test("GET /health returns admin service health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.service).toBe("shopsphere-admin");

    expect(response.body.timestamp).toBeDefined();
  });

  test("returns 404 for unknown route", async () => {
    const response = await request(app).get("/this-route-does-not-exist");

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });
});
