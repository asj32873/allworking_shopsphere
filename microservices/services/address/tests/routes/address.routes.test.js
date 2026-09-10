const express = require("express");
const request = require("supertest");

jest.mock("../../src/controllers/address.controller", () => ({
  list: jest.fn((req, res) =>
    res.status(200).json({
      controller: "list",
    }),
  ),

  create: jest.fn((req, res) =>
    res.status(201).json({
      controller: "create",
    }),
  ),

  update: jest.fn((req, res) =>
    res.status(200).json({
      controller: "update",
    }),
  ),

  remove: jest.fn((req, res) =>
    res.status(200).json({
      controller: "remove",
    }),
  ),

  setDefault: jest.fn((req, res) =>
    res.status(200).json({
      controller: "setDefault",
    }),
  ),

  internalGet: jest.fn((req, res) =>
    res.status(200).json({
      controller: "internalGet",
    }),
  ),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      _id: "user-123",
      role: "USER",
    };

    next();
  }),

  authorize: jest.fn((...args) => {
    return (req, res, next) => {
      next();
    };
  }),
}));

jest.mock("@shopsphere/common", () => ({
  internal: jest.fn((req, res, next) => {
    next();
  }),
}));

/*
 * IMPORTANT:
 *
 * Import the mocks first, then import the router.
 *
 * The router executes:
 *
 * authorize("USER")
 *
 * while the router module is being imported.
 */
const controller = require("../../src/controllers/address.controller");
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

describe("address routes", () => {
  let app;

  beforeEach(() => {
    /*
     * Do NOT use jest.clearAllMocks() here.
     *
     * authorize("USER") and internal(...) are called
     * during router initialization.
     *
     * Clearing all mocks here would erase the
     * authorize("USER") initialization call.
     */

    controller.list.mockClear();
    controller.create.mockClear();
    controller.update.mockClear();
    controller.remove.mockClear();
    controller.setDefault.mockClear();
    controller.internalGet.mockClear();

    auth.authenticate.mockClear();

    app = createApp();
  });

  test("GET /api/addresses reaches list controller", async () => {
    const response = await request(app).get("/api/addresses");

    expect(response.status).toBe(200);

    expect(auth.authenticate).toHaveBeenCalled();

    expect(controller.list).toHaveBeenCalled();
  });

  test("POST /api/addresses reaches create controller", async () => {
    const response = await request(app).post("/api/addresses").send({
      type: "Home",
      addressLine: "123 Main Street",
    });

    expect(response.status).toBe(201);

    expect(auth.authenticate).toHaveBeenCalled();

    expect(controller.create).toHaveBeenCalled();
  });

  test("PUT /api/addresses/:id reaches update controller", async () => {
    const response = await request(app).put("/api/addresses/address-123").send({
      city: "Mysuru",
    });

    expect(response.status).toBe(200);

    expect(controller.update).toHaveBeenCalled();

    const req = controller.update.mock.calls[0][0];

    expect(req.params.id).toBe("address-123");
  });

  test("DELETE /api/addresses/:id reaches remove controller", async () => {
    const response = await request(app).delete("/api/addresses/address-123");

    expect(response.status).toBe(200);

    expect(controller.remove).toHaveBeenCalled();

    const req = controller.remove.mock.calls[0][0];

    expect(req.params.id).toBe("address-123");
  });

  test("PATCH /api/addresses/:id/default reaches setDefault", async () => {
    const response = await request(app).patch(
      "/api/addresses/address-123/default",
    );

    expect(response.status).toBe(200);

    expect(controller.setDefault).toHaveBeenCalled();

    const req = controller.setDefault.mock.calls[0][0];

    expect(req.params.id).toBe("address-123");
  });

  test("GET internal address reaches internalGet", async () => {
    const response = await request(app).get(
      "/internal/addresses/user-123/address-123",
    );

    expect(response.status).toBe(200);

    expect(controller.internalGet).toHaveBeenCalled();

    const req = controller.internalGet.mock.calls[0][0];

    expect(req.params.userId).toBe("user-123");

    expect(req.params.id).toBe("address-123");
  });

  test("authorize middleware is configured for the routes", () => {
    const routes = router.stack.filter((layer) => layer.route);

    expect(routes).toHaveLength(6);

    const protectedRoutes = routes.filter((layer) =>
      layer.route.path.startsWith("/api/addresses"),
    );

    expect(protectedRoutes).toHaveLength(5);

    protectedRoutes.forEach((layer) => {
      expect(layer.route.stack.length).toBe(3);
    });
  });
});
