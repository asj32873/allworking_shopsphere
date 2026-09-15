const express = require("express");
const request = require("supertest");

jest.mock("../../src/controllers/cart.controller", () => ({
  getCart: jest.fn((req, res) =>
    res.status(200).json({ controller: "getCart" }),
  ),
  add: jest.fn((req, res) =>
    res.status(200).json({ controller: "add" }),
  ),
  update: jest.fn((req, res) =>
    res.status(200).json({ controller: "update" }),
  ),
  remove: jest.fn((req, res) =>
    res.status(200).json({ controller: "remove" }),
  ),
  clear: jest.fn((req, res) =>
    res.status(200).json({ controller: "clear" }),
  ),
  internalCart: jest.fn((req, res) =>
    res.status(200).json({ controller: "internalCart" }),
  ),
  internalClear: jest.fn((req, res) =>
    res.status(200).json({ controller: "internalClear" }),
  ),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { _id: "user-123", role: "USER" };
    req.auth = { id: "user-123" };
    next();
  }),
  authorize: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("@shopsphere/common", () => ({
  internal: jest.fn((req, res, next) => next()),
}));

const controller = require("../../src/controllers/cart.controller");
const auth = require("../../src/middleware/auth");

const router = require("../../src/routes");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe("cart routes", () => {
  let app;

  beforeEach(() => {
    controller.getCart.mockClear();
    controller.add.mockClear();
    controller.update.mockClear();
    controller.remove.mockClear();
    controller.clear.mockClear();
    controller.internalCart.mockClear();
    controller.internalClear.mockClear();
    auth.authenticate.mockClear();

    app = createApp();
  });

  test("GET /api/cart reaches getCart controller", async () => {
    const response = await request(app).get("/api/cart");

    expect(response.status).toBe(200);
    expect(auth.authenticate).toHaveBeenCalled();
    expect(controller.getCart).toHaveBeenCalled();
  });

  test("POST /api/cart/items reaches add controller", async () => {
    const response = await request(app)
      .post("/api/cart/items")
      .send({ productId: "product-123", quantity: 2 });

    expect(response.status).toBe(200);
    expect(auth.authenticate).toHaveBeenCalled();
    expect(controller.add).toHaveBeenCalled();
  });

  test("PATCH /api/cart/items/:id reaches update controller", async () => {
    const response = await request(app)
      .patch("/api/cart/items/cart-123")
      .send({ quantity: 3 });

    expect(response.status).toBe(200);
    expect(controller.update).toHaveBeenCalled();

    const req = controller.update.mock.calls[0][0];
    expect(req.params.id).toBe("cart-123");
    expect(req.body.quantity).toBe(3);
  });

  test("DELETE /api/cart/items/:id reaches remove controller", async () => {
    const response = await request(app).delete("/api/cart/items/cart-123");

    expect(response.status).toBe(200);
    expect(controller.remove).toHaveBeenCalled();

    const req = controller.remove.mock.calls[0][0];
    expect(req.params.id).toBe("cart-123");
  });

  test("DELETE /api/cart reaches clear controller", async () => {
    const response = await request(app).delete("/api/cart");

    expect(response.status).toBe(200);
    expect(controller.clear).toHaveBeenCalled();
  });

  test("GET internal cart reaches internalCart", async () => {
    const response = await request(app).get(
      "/internal/cart/user-123",
    );

    expect(response.status).toBe(200);
    expect(controller.internalCart).toHaveBeenCalled();

    const req = controller.internalCart.mock.calls[0][0];
    expect(req.params.userId).toBe("user-123");
  });

  test("POST internal cart clear reaches internalClear", async () => {
    const response = await request(app).post(
      "/internal/cart/user-123/clear",
    );

    expect(response.status).toBe(200);
    expect(controller.internalClear).toHaveBeenCalled();

    const req = controller.internalClear.mock.calls[0][0];
    expect(req.params.userId).toBe("user-123");
  });

  test("has seven routes", () => {
    const routes = router.stack.filter((layer) => layer.route);

    expect(routes).toHaveLength(7);
  });

  test("five public cart routes have authentication and authorization", () => {
    const routes = router.stack.filter((layer) => layer.route);
    const publicRoutes = routes.filter((layer) =>
      layer.route.path.startsWith("/api/cart"),
    );

    expect(publicRoutes).toHaveLength(5);
    publicRoutes.forEach((layer) => {
      expect(layer.route.stack.length).toBe(3);
    });
  });
});
