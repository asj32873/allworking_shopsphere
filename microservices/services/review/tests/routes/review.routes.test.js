const express = require("express");
const request = require("supertest");

jest.mock("../../src/controllers/review.controller", () => ({
  listForProduct: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      route: "listForProduct",
    });
  }),

  create: jest.fn((req, res) => {
    res.status(201).json({
      success: true,
      route: "create",
    });
  }),

  update: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      route: "update",
    });
  }),

  remove: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      route: "remove",
    });
  }),
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: "user123",
      role: "USER",
    };

    req.auth = {
      id: "user123",
    };

    next();
  }),

  authorize: jest.fn((...roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission for this resource.",
        });
      }

      next();
    };
  }),
}));

const router = require("../../src/routes");

const {
  listForProduct,
  create,
  update,
  remove,
} = require("../../src/controllers/review.controller");

const { authenticate } = require("../../src/middleware/auth");

describe("Review Routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(router);
  });

  test("GET /api/reviews/product/:productId should call listForProduct", async () => {
    const response = await request(app)
      .get("/api/reviews/product/product123");

    expect(response.statusCode).toBe(200);

    expect(listForProduct).toHaveBeenCalled();

    expect(response.body).toEqual({
      success: true,
      route: "listForProduct",
    });
  });

  test("POST /api/reviews/product/:productId should call authenticate and create", async () => {
    const response = await request(app)
      .post("/api/reviews/product/product123")
      .send({
        rating: 5,
        review: "Excellent product",
      });

    expect(response.statusCode).toBe(201);

    expect(authenticate).toHaveBeenCalled();

    expect(create).toHaveBeenCalled();

    expect(response.body).toEqual({
      success: true,
      route: "create",
    });
  });

  test("PUT /api/reviews/:id should call authenticate and update", async () => {
    const response = await request(app)
      .put("/api/reviews/review123")
      .send({
        rating: 4,
        review: "Updated review",
      });

    expect(response.statusCode).toBe(200);

    expect(authenticate).toHaveBeenCalled();

    expect(update).toHaveBeenCalled();

    expect(response.body).toEqual({
      success: true,
      route: "update",
    });
  });

  test("DELETE /api/reviews/:id should call authenticate and remove", async () => {
    const response = await request(app)
      .delete("/api/reviews/review123");

    expect(response.statusCode).toBe(200);

    expect(authenticate).toHaveBeenCalled();

    expect(remove).toHaveBeenCalled();

    expect(response.body).toEqual({
      success: true,
      route: "remove",
    });
  });

  test("should return 404 for an unknown review route", async () => {
    const response = await request(app)
      .get("/api/reviews/unknown/path");

    expect(response.statusCode).toBe(404);
  });
});