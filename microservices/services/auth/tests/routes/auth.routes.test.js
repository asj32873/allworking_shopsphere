const express = require("express");
const request = require("supertest");

jest.mock("../../src/controllers/auth.controller", () => ({
  register: jest.fn((req, res) =>
    res.status(201).json({ controller: "register" }),
  ),

  registerVendor: jest.fn((req, res) =>
    res.status(201).json({ controller: "registerVendor" }),
  ),

  login: jest.fn((req, res) =>
    res.status(200).json({ controller: "login" }),
  ),

  auth0Login: jest.fn((req, res) =>
    res.status(200).json({ controller: "auth0Login" }),
  ),

  me: jest.fn((req, res) =>
    res.status(200).json({ controller: "me" }),
  ),

  internalUser: jest.fn((req, res) =>
    res.status(200).json({ controller: "internalUser" }),
  ),

  internalUsers: jest.fn((req, res) =>
    res.status(200).json({ controller: "internalUsers" }),
  ),

  updateInternal: jest.fn((req, res) =>
    res.status(200).json({ controller: "updateInternal" }),
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
}));

jest.mock("@shopsphere/common", () => ({
  validate: jest.fn(() => (req, res, next) => next()),
  internal: jest.fn((req, res, next) => next()),
}));

const controller = require("../../src/controllers/auth.controller");
const auth = require("../../src/middleware/auth");
const router = require("../../src/routes");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe("auth routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test("POST /api/auth/register reaches register controller", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "secret123",
      });

    expect(response.status).toBe(201);
    expect(controller.register).toHaveBeenCalled();
  });

  test("POST /api/auth/vendor/register reaches registerVendor controller", async () => {
    const response = await request(app)
      .post("/api/auth/vendor/register")
      .send({
        ownerName: "Vendor Owner",
        storeName: "Test Store",
        email: "vendor@example.com",
        storeAddress: "123 Main Street",
        password: "secret123",
      });

    expect(response.status).toBe(201);
    expect(controller.registerVendor).toHaveBeenCalled();
  });

  test("POST /api/auth/login reaches login controller", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "secret123",
      });

    expect(response.status).toBe(200);
    expect(controller.login).toHaveBeenCalled();
  });

  test("POST /api/auth/auth0/login reaches auth0Login controller", async () => {
    const response = await request(app)
      .post("/api/auth/auth0/login")
      .send({
        token: "auth0-token",
      });

    expect(response.status).toBe(200);
    expect(controller.auth0Login).toHaveBeenCalled();
  });

  test("GET /api/auth/me uses authenticate and reaches me", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(200);
    expect(auth.authenticate).toHaveBeenCalled();
    expect(controller.me).toHaveBeenCalled();
  });

  test("POST /api/auth/logout uses authenticate", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(200);
    expect(auth.authenticate).toHaveBeenCalled();
    expect(response.body).toEqual({
      success: true,
      message: "Logged out.",
    });
  });

  test("GET /internal/users/:id reaches internalUser", async () => {
    const response = await request(app).get("/internal/users/user-123");

    expect(response.status).toBe(200);
    expect(controller.internalUser).toHaveBeenCalled();

    const req = controller.internalUser.mock.calls[0][0];
    expect(req.params.id).toBe("user-123");
  });

  test("GET /internal/admin/users reaches internalUsers", async () => {
    const response = await request(app).get("/internal/admin/users");

    expect(response.status).toBe(200);
    expect(controller.internalUsers).toHaveBeenCalled();
  });

  test("PATCH /internal/users/:id reaches updateInternal", async () => {
    const response = await request(app)
      .patch("/internal/users/user-123")
      .send({
        name: "Updated User",
        status: "ACTIVE",
      });

    expect(response.status).toBe(200);
    expect(controller.updateInternal).toHaveBeenCalled();

    const req = controller.updateInternal.mock.calls[0][0];
    expect(req.params.id).toBe("user-123");
    expect(req.body).toEqual({
      name: "Updated User",
      status: "ACTIVE",
    });
  });
});
