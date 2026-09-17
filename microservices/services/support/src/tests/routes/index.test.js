jest.mock("../../controllers/issue.controller", () => ({
  create: jest.fn((req, res) => res.send("create")),
  list: jest.fn((req, res) => res.send("list")),
  getById: jest.fn((req, res) => res.send("get")),
  update: jest.fn((req, res) => res.send("update")),
  internalVendorCount: jest.fn((req, res) => res.send("count")),
}));

jest.mock("@shopsphere/common", () => ({
  validate: jest.fn(() => (req, res, next) => next()),
  internal: jest.fn((req, res, next) => next()),
}));

jest.mock("../../middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => next()),
  authorize: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("../../validators/issue", () => ({
  createIssueSchema: { name: "create" },
  updateIssueSchema: { name: "update" },
}));

const express = require("express");
const request = require("supertest");

describe("support routes", () => {
  let router;
  let app;
  let controller;
  let auth;
  let common;
  let validate;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-apply mocks after resetModules by loading the modules inside
    // the isolated registry used for this test.
    jest.isolateModules(() => {
      router = require("../../routes");
      controller = require("../../controllers/issue.controller");
      auth = require("../../middleware/auth");
      common = require("@shopsphere/common");
      validate = require("../../validators/issue");
    });

    app = express();
    app.use(router);
  });

  test("internal vendor count route is registered before authentication", async () => {
    const res = await request(app).get("/internal/issues/vendor/v1/count");

    expect(res.status).toBe(200);
    expect(res.text).toBe("count");
    expect(common.internal).toHaveBeenCalled();
    expect(controller.internalVendorCount).toHaveBeenCalled();
  });

  test("POST /api/issues uses USER authorization and create validation", async () => {
    const res = await request(app).post("/api/issues").send({
      subject: "Problem",
      description: "Details",
    });

    expect(res.status).toBe(200);
    expect(res.text).toBe("create");
    expect(auth.authenticate).toHaveBeenCalled();
    expect(auth.authorize).toHaveBeenCalledWith("USER");
    expect(common.validate).toHaveBeenCalledWith(validate.createIssueSchema);
    expect(controller.create).toHaveBeenCalled();
  });

  test("GET /api/issues allows USER, VENDOR and ADMIN", async () => {
    const res = await request(app).get("/api/issues");

    expect(res.status).toBe(200);
    expect(res.text).toBe("list");
    expect(auth.authorize).toHaveBeenCalledWith(
      "USER",
      "VENDOR",
      "ADMIN"
    );
    expect(controller.list).toHaveBeenCalled();
  });

  test("GET /api/issues/:id uses authorization and getById", async () => {
    const res = await request(app).get("/api/issues/i1");

    expect(res.status).toBe(200);
    expect(res.text).toBe("get");
    expect(controller.getById).toHaveBeenCalled();
  });

  test("PATCH /api/issues/:id uses authorization, validation and update", async () => {
    const res = await request(app)
      .patch("/api/issues/i1")
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(200);
    expect(res.text).toBe("update");
    expect(auth.authorize).toHaveBeenCalledWith(
      "USER",
      "VENDOR",
      "ADMIN"
    );
    expect(common.validate).toHaveBeenCalledWith(validate.updateIssueSchema);
    expect(controller.update).toHaveBeenCalled();
  });
});
