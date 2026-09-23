jest.mock("../../src/controllers/vendor.controller", () => ({
  profile: jest.fn((req, res) => res.send("profile")),
  dashboard: jest.fn((req, res) => res.send("dashboard")),
  internalCreate: jest.fn((req, res) => res.send("create")),
  internalGetByUser: jest.fn((req, res) => res.send("by-user")),
  internalList: jest.fn((req, res) => res.send("list")),
  internalUpdate: jest.fn((req, res) => res.send("update")),
  internalRemove: jest.fn((req, res) => res.send("remove")),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => next()),
  authorize: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("@shopsphere/common", () => ({
  internal: jest.fn((req, res, next) => next()),
}));

const express = require("express");
const request = require("supertest");

describe("vendor routes", () => {
  let router;
  let app;
  let c;
  let auth;

  beforeEach(() => {
    jest.resetModules();
    router = require("../../src/routes");
    c = require("../../src/controllers/vendor.controller");
    auth = require("../../src/middleware/auth");

    app = express();
    app.use(router);
  });

  test("GET /api/vendor/profile uses authentication, VENDOR authorization and profile controller", async () => {
    const res = await request(app).get("/api/vendor/profile");

    expect(res.status).toBe(200);
    expect(res.text).toBe("profile");
    expect(auth.authenticate).toHaveBeenCalled();
    expect(auth.authorize).toHaveBeenCalledWith("VENDOR");
    expect(c.profile).toHaveBeenCalled();
  });

  test("GET /api/vendor/dashboard uses authentication, VENDOR authorization and dashboard controller", async () => {
    const res = await request(app).get("/api/vendor/dashboard");

    expect(res.status).toBe(200);
    expect(res.text).toBe("dashboard");
    expect(auth.authorize).toHaveBeenCalledWith("VENDOR");
    expect(c.dashboard).toHaveBeenCalled();
  });

  test("internal POST route calls internal middleware and create controller", async () => {
    const res = await request(app).post("/internal/vendors").send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("create");
    expect(c.internalCreate).toHaveBeenCalled();
  });

  test("internal GET by user route works", async () => {
    const res = await request(app).get("/internal/vendors/by-user/u1");

    expect(res.status).toBe(200);
    expect(res.text).toBe("by-user");
  });

  test("internal list route works", async () => {
    const res = await request(app).get("/internal/vendors");

    expect(res.status).toBe(200);
    expect(res.text).toBe("list");
  });

  test("internal patch route works", async () => {
    const res = await request(app).patch("/internal/vendors/v1").send({});

    expect(res.status).toBe(200);
    expect(res.text).toBe("update");
  });

  test("internal delete route works", async () => {
    const res = await request(app).delete("/internal/vendors/v1");

    expect(res.status).toBe(200);
    expect(res.text).toBe("remove");
  });
});

