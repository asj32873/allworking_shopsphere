const express = require("express");
const request = require("supertest");

jest.mock("../../src/controllers/admin.controller", () => ({
  dashboard: jest.fn((req, res) =>
    res.status(200).json({ controller: "dashboard" }),
  ),

  vendors: jest.fn((req, res) =>
    res.status(200).json({ controller: "vendors" }),
  ),

  approveVendor: jest.fn((req, res) =>
    res.status(200).json({ controller: "approveVendor" }),
  ),

  rejectVendor: jest.fn((req, res) =>
    res.status(200).json({ controller: "rejectVendor" }),
  ),

  deleteVendor: jest.fn((req, res) =>
    res.status(200).json({ controller: "deleteVendor" }),
  ),

  users: jest.fn((req, res) => res.status(200).json({ controller: "users" })),

  updateUserStatus: jest.fn((req, res) =>
    res.status(200).json({ controller: "updateUserStatus" }),
  ),

  orders: jest.fn((req, res) => res.status(200).json({ controller: "orders" })),

  issues: jest.fn((req, res) => res.status(200).json({ controller: "issues" })),

  assignVendor: jest.fn((req, res) =>
    res.status(200).json({ controller: "assignVendor" }),
  ),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: "admin-123",
      role: "ADMIN",
    };

    next();
  }),

  authorize: jest.fn((...roles) => {
    return (req, res, next) => {
      next();
    };
  }),
}));

const controller = require("../../src/controllers/admin.controller");
const auth = require("../../src/middleware/auth");

let router;

beforeAll(() => {
  router = require("../../src/routes");
});

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(router);

  return app;
}

describe("admin routes", () => {
  let app;

  beforeEach(() => {
    Object.values(controller).forEach((mock) => {
      if (mock.mockClear) {
        mock.mockClear();
      }
    });

    auth.authenticate.mockClear();

    app = createApp();
  });

  test("GET /api/admin/dashboard reaches dashboard", async () => {
    const response = await request(app).get("/api/admin/dashboard");

    expect(response.status).toBe(200);
    expect(controller.dashboard).toHaveBeenCalled();
    expect(auth.authenticate).toHaveBeenCalled();

    expect(response.body.controller).toBe("dashboard");
  });

  test("GET /api/admin/vendors reaches vendors", async () => {
    const response = await request(app).get("/api/admin/vendors");

    expect(response.status).toBe(200);
    expect(controller.vendors).toHaveBeenCalled();
  });

  test("PATCH /api/admin/vendors/:id/approve reaches approveVendor", async () => {
    const response = await request(app).patch(
      "/api/admin/vendors/vendor-123/approve",
    );

    expect(response.status).toBe(200);
    expect(controller.approveVendor).toHaveBeenCalled();

    const req = controller.approveVendor.mock.calls[0][0];

    expect(req.params.id).toBe("vendor-123");
  });

  test("PATCH /api/admin/vendors/:id/reject reaches rejectVendor", async () => {
    const response = await request(app).patch(
      "/api/admin/vendors/vendor-123/reject",
    );

    expect(response.status).toBe(200);
    expect(controller.rejectVendor).toHaveBeenCalled();

    const req = controller.rejectVendor.mock.calls[0][0];

    expect(req.params.id).toBe("vendor-123");
  });

  test("DELETE /api/admin/vendors/:id reaches deleteVendor", async () => {
    const response = await request(app).delete("/api/admin/vendors/vendor-123");

    expect(response.status).toBe(200);
    expect(controller.deleteVendor).toHaveBeenCalled();

    const req = controller.deleteVendor.mock.calls[0][0];

    expect(req.params.id).toBe("vendor-123");
  });

  test("GET /api/admin/users reaches users", async () => {
    const response = await request(app).get("/api/admin/users");

    expect(response.status).toBe(200);
    expect(controller.users).toHaveBeenCalled();
  });

  test("PATCH /api/admin/users/:id/status reaches updateUserStatus", async () => {
    const response = await request(app)
      .patch("/api/admin/users/user-123/status")
      .send({
        status: "DISABLED",
      });

    expect(response.status).toBe(200);
    expect(controller.updateUserStatus).toHaveBeenCalled();

    const req = controller.updateUserStatus.mock.calls[0][0];

    expect(req.params.id).toBe("user-123");
    expect(req.body.status).toBe("DISABLED");
  });

  test("GET /api/admin/orders reaches orders", async () => {
    const response = await request(app).get("/api/admin/orders");

    expect(response.status).toBe(200);
    expect(controller.orders).toHaveBeenCalled();
  });

  test("GET /api/admin/issues reaches issues", async () => {
    const response = await request(app).get("/api/admin/issues");

    expect(response.status).toBe(200);
    expect(controller.issues).toHaveBeenCalled();
  });

  test("PATCH /api/admin/issues/:id/assign reaches assignVendor", async () => {
    const response = await request(app)
      .patch("/api/admin/issues/issue-123/assign")
      .send({
        vendorId: "vendor-123",
      });

    expect(response.status).toBe(200);
    expect(controller.assignVendor).toHaveBeenCalled();

    const req = controller.assignVendor.mock.calls[0][0];

    expect(req.params.id).toBe("issue-123");
    expect(req.body.vendorId).toBe("vendor-123");
  });

  test("router has 10 admin routes", () => {
    const routes = router.stack.filter((layer) => layer.route);

    expect(routes).toHaveLength(10);
  });

  test("all admin routes use authentication middleware", async () => {
    const routes = [
      ["get", "/api/admin/dashboard"],
      ["get", "/api/admin/vendors"],
      ["patch", "/api/admin/vendors/vendor-123/approve"],
      ["patch", "/api/admin/vendors/vendor-123/reject"],
      ["delete", "/api/admin/vendors/vendor-123"],
      ["get", "/api/admin/users"],
      ["patch", "/api/admin/users/user-123/status"],
      ["get", "/api/admin/orders"],
      ["get", "/api/admin/issues"],
      ["patch", "/api/admin/issues/issue-123/assign"],
    ];

    for (const [method, path] of routes) {
      auth.authenticate.mockClear();

      await request(app)[method](path);

      expect(auth.authenticate).toHaveBeenCalled();
    }
  });

  test("authorize is configured for ADMIN", () => {
    expect(auth.authorize).toHaveBeenCalledWith("ADMIN");
  });
});
