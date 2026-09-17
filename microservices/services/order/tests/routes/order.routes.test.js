const express = require("express");
const request = require("supertest");

jest.mock("../../src/controllers/order.controller", () => ({
  createOrder: jest.fn((req, res) =>
    res.status(201).json({
      controller: "createOrder",
    }),
  ),

  listMyOrders: jest.fn((req, res) =>
    res.status(200).json({
      controller: "listMyOrders",
    }),
  ),

  getById: jest.fn((req, res) =>
    res.status(200).json({
      controller: "getById",
    }),
  ),

  tracking: jest.fn((req, res) =>
    res.status(200).json({
      controller: "tracking",
    }),
  ),

  vendorList: jest.fn((req, res) =>
    res.status(200).json({
      controller: "vendorList",
    }),
  ),

  vendorUpdateStatus: jest.fn((req, res) =>
    res.status(200).json({
      controller: "vendorUpdateStatus",
    }),
  ),

  adminList: jest.fn((req, res) =>
    res.status(200).json({
      controller: "adminList",
    }),
  ),

  adminUpdateStatus: jest.fn((req, res) =>
    res.status(200).json({
      controller: "adminUpdateStatus",
    }),
  ),

  internalCreatePaid: jest.fn((req, res) =>
    res.status(201).json({
      controller: "internalCreatePaid",
    }),
  ),

  internalReviewEligibility: jest.fn((req, res) =>
    res.status(200).json({
      controller: "internalReviewEligibility",
    }),
  ),

  internalVendorOrders: jest.fn((req, res) =>
    res.status(200).json({
      controller: "internalVendorOrders",
    }),
  ),

  internalVendorItems: jest.fn((req, res) =>
    res.status(200).json({
      controller: "internalVendorItems",
    }),
  ),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: "user-123",
      role: "USER",
    };

    next();
  }),

  authorize: jest.fn(() => {
    return (req, res, next) => {
      next();
    };
  }),
}));

jest.mock("@shopsphere/common", () => ({
  validate: jest.fn(() => {
    return (req, res, next) => next();
  }),

  internal: jest.fn((req, res, next) => {
    next();
  }),
}));

const controller = require("../../src/controllers/order.controller");
const auth = require("../../src/middleware/auth");

const router = require("../../src/routes");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(router);

  return app;
}

describe("order routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("POST /api/orders reaches createOrder", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        addressId: "address-123",
      });

    expect(response.status).toBe(201);
    expect(response.body.controller).toBe("createOrder");

    expect(controller.createOrder).toHaveBeenCalled();
    expect(auth.authenticate).toHaveBeenCalled();
  });

  test("GET /api/orders reaches listMyOrders", async () => {
    const response = await request(app)
      .get("/api/orders");

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe("listMyOrders");
  });

  test("GET /api/orders/:id reaches getById", async () => {
    const response = await request(app)
      .get("/api/orders/order-123");

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe("getById");
  });

  test("GET /api/orders/:id/tracking reaches tracking", async () => {
    const response = await request(app)
      .get("/api/orders/order-123/tracking");

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe("tracking");
  });

  test("GET vendor list reaches vendorList", async () => {
    const response = await request(app)
      .get("/api/orders/vendor/list");

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe("vendorList");
  });

  test("PATCH vendor status reaches vendorUpdateStatus", async () => {
    const response = await request(app)
      .patch("/api/orders/vendor/order-1/items/item-1/status")
      .send({
        status: "CONFIRMED",
      });

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe(
      "vendorUpdateStatus",
    );
  });

  test("GET admin list reaches adminList", async () => {
    const response = await request(app)
      .get("/api/orders/admin/list");

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe("adminList");
  });

  test("PATCH admin status reaches adminUpdateStatus", async () => {
    const response = await request(app)
      .patch("/api/orders/admin/order-1/items/item-1/status")
      .send({
        status: "DELIVERED",
      });

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe(
      "adminUpdateStatus",
    );
  });

  test("POST internal paid reaches internalCreatePaid", async () => {
    const response = await request(app)
      .post("/internal/orders/paid")
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.controller).toBe(
      "internalCreatePaid",
    );
  });

  test("GET internal review eligibility reaches controller", async () => {
    const response = await request(app)
      .get(
        "/internal/orders/review-eligibility/user-1/product-1",
      );

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe(
      "internalReviewEligibility",
    );
  });

  test("GET internal vendor order ids reaches controller", async () => {
    const response = await request(app)
      .get(
        "/internal/orders/vendor/vendor-1/order-ids",
      );

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe(
      "internalVendorOrders",
    );
  });

  test("GET internal vendor items reaches controller", async () => {
    const response = await request(app)
      .get(
        "/internal/orders/vendor/vendor-1/items",
      );

    expect(response.status).toBe(200);
    expect(response.body.controller).toBe(
      "internalVendorItems",
    );
  });
});