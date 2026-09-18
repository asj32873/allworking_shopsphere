const express = require("express");
const request = require("supertest");

const mockList = jest.fn((req, res) => res.json({}));
const mockGetById = jest.fn((req, res) => res.json({}));
const mockCreate = jest.fn((req, res) => res.json({}));
const mockUpdate = jest.fn((req, res) => res.json({}));
const mockRemove = jest.fn((req, res) => res.json({}));
const mockUpdateStock = jest.fn((req, res) => res.json({}));

const mockInternalList = jest.fn((req, res) => res.json({}));
const mockInternalGet = jest.fn((req, res) => res.json({}));
const mockInternalReserve = jest.fn((req, res) => res.json({}));
const mockInternalRelease = jest.fn((req, res) => res.json({}));
const mockInternalRating = jest.fn((req, res) => res.json({}));

const mockAsk = jest.fn((req, res) => res.json({}));

const mockAuthenticate = jest.fn((req, res, next) => next());
const mockAuthorize = jest.fn(() => (req, res, next) => next());
const mockValidate = jest.fn(() => (req, res, next) => next());
const mockInternal = jest.fn((req, res, next) => next());

const mockProductSchema = {
  partial: jest.fn(() => ({})),
};

jest.mock("../../src/controllers/product.controller", () => ({
  list: mockList,
  getById: mockGetById,
  create: mockCreate,
  update: mockUpdate,
  remove: mockRemove,
  updateStock: mockUpdateStock,
  internalList: mockInternalList,
  internalGet: mockInternalGet,
  internalReserve: mockInternalReserve,
  internalRelease: mockInternalRelease,
  internalRating: mockInternalRating,
}));

jest.mock("../../src/controllers/qa.controller", () => ({
  ask: mockAsk,
}));

jest.mock("../../src/middleware/auth", () => ({
  authenticate: mockAuthenticate,
  authorize: mockAuthorize,
}));

jest.mock("../../src/validators/product", () => ({
  productSchema: mockProductSchema,
}));

jest.mock("@shopsphere/common", () => ({
  validate: mockValidate,
  internal: mockInternal,
}));

const router = require("../../src/routes/index");

describe("product routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(router);
  });

  test("GET /api/products", async () => {
    await request(app)
      .get("/api/products")
      .expect(200);

    expect(mockList).toHaveBeenCalled();
  });

  test("GET /api/products/:id", async () => {
    await request(app)
      .get("/api/products/product-1")
      .expect(200);

    expect(mockGetById).toHaveBeenCalled();
  });

  test("POST /api/products", async () => {
    await request(app)
      .post("/api/products")
      .send({
        name: "Test Product",
      })
      .expect(200);

    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
  });

  test("POST /api/products/:id/qa", async () => {
    await request(app)
      .post("/api/products/product-1/qa")
      .send({
        question: "Is this available?",
      })
      .expect(200);

    expect(mockAsk).toHaveBeenCalled();
  });

  test("GET /internal/products", async () => {
    await request(app)
      .get("/internal/products")
      .expect(200);

    expect(mockInternal).toHaveBeenCalled();
    expect(mockInternalList).toHaveBeenCalled();
  });

  test("PUT /api/products/:id", async () => {
    await request(app)
      .put("/api/products/product-1")
      .send({
        price: 1000,
      })
      .expect(200);

    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  test("DELETE /api/products/:id", async () => {
    await request(app)
      .delete("/api/products/product-1")
      .expect(200);

    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
  });

  test("PATCH /api/products/:id/stock", async () => {
    await request(app)
      .patch("/api/products/product-1/stock")
      .send({
        stock: 10,
      })
      .expect(200);

    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockUpdateStock).toHaveBeenCalled();
  });

  test("GET /internal/products/:id", async () => {
    await request(app)
      .get("/internal/products/product-1")
      .expect(200);

    expect(mockInternal).toHaveBeenCalled();
    expect(mockInternalGet).toHaveBeenCalled();
  });

  test("POST /internal/products/reserve", async () => {
    await request(app)
      .post("/internal/products/reserve")
      .send({})
      .expect(200);

    expect(mockInternal).toHaveBeenCalled();
    expect(mockInternalReserve).toHaveBeenCalled();
  });

  test("POST /internal/products/release", async () => {
    await request(app)
      .post("/internal/products/release")
      .send({})
      .expect(200);

    expect(mockInternal).toHaveBeenCalled();
    expect(mockInternalRelease).toHaveBeenCalled();
  });

  test("PATCH /internal/products/:id/rating", async () => {
    await request(app)
      .patch("/internal/products/product-1/rating")
      .send({
        rating: 4,
      })
      .expect(200);

    expect(mockInternal).toHaveBeenCalled();
    expect(mockInternalRating).toHaveBeenCalled();
  });
});