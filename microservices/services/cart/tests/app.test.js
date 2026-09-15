const request = require("supertest");

jest.mock("../src/models/CartItem", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      _id: "user-123",
      role: "USER",
    };

    req.auth = {
      id: "user-123",
    };

    next();
  }),

  authorize: jest.fn(() => (req, res, next) => next()),
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

  internal: jest.fn((req, res, next) => next()),
}));

const app = require("../src/app");

describe("Cart Service App", () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  describe("Global middleware", () => {
    test("runs requestId middleware", async () => {
      const { requestId } = require("@shopsphere/common");

      await request(app).get("/health");

      expect(requestId).toHaveBeenCalled();
    });

    test("sets security headers with helmet", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
    });

    test("supports CORS", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:5173");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173",
      );

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    test("parses JSON request body", async () => {
      // Reset counter first because postRetryAttempts is module-level state.
      await request(app).post("/test/post-retry/reset");

      const response = await request(app).post("/test/post-retry").send({
        productId: "product-123",
        quantity: 2,
      });

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "Temporary POST failure",
        attempt: 1,
      });
    });

    test("parses URL encoded request body", async () => {
      // Reset counter so this test starts at attempt 1.
      await request(app).post("/test/post-retry/reset");

      const response = await request(app)
        .post("/test/post-retry")
        .type("form")
        .send({
          productId: "product-123",
          quantity: "2",
        });

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "Temporary POST failure",
        attempt: 1,
      });
    });
  });

  describe("GET /health", () => {
    test("returns service health", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("shopsphere-cart");
      expect(response.body.timestamp).toBeDefined();

      expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
    });
  });

  describe("GET /test/slow", () => {
    test("starts the slow request without failing the test", async () => {
      /*
       * /test/slow intentionally waits 10 seconds.
       *
       * We don't wait for the response here because doing so would
       * unnecessarily make the test suite slow.
       *
       * The important application code is executed when the request
       * reaches the handler.
       */
      const promise = request(app).get("/test/slow");

      expect(promise).toBeDefined();

      /*
       * Abort the request so Jest does not keep an open connection.
       */
      promise.abort();
    });
  });

  describe("GET /test/retry", () => {
    beforeEach(async () => {
      await request(app).post("/test/retry/reset");
    });

    test("returns 503 on first attempt", async () => {
      const response = await request(app).get("/test/retry");

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "Temporary failure",
        attempt: 1,
      });
    });

    test("returns 503 on second attempt", async () => {
      await request(app).get("/test/retry");

      const response = await request(app).get("/test/retry");

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "Temporary failure",
        attempt: 2,
      });
    });

    test("returns 200 on third attempt", async () => {
      await request(app).get("/test/retry");
      await request(app).get("/test/retry");

      const response = await request(app).get("/test/retry");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: "Success after retry",
        attempt: 3,
      });
    });
  });

  describe("POST /test/retry/reset", () => {
    test("resets retry counter", async () => {
      await request(app).get("/test/retry");
      await request(app).get("/test/retry");

      const resetResponse = await request(app).post("/test/retry/reset");

      expect(resetResponse.status).toBe(200);

      expect(resetResponse.body).toEqual({
        success: true,
        message: "Retry counter reset",
      });

      const response = await request(app).get("/test/retry");

      expect(response.status).toBe(503);
      expect(response.body.attempt).toBe(1);
    });
  });

  describe("POST /test/post-retry", () => {
    beforeEach(async () => {
      await request(app).post("/test/post-retry/reset");
    });

    test("returns 503 on first attempt", async () => {
      const response = await request(app).post("/test/post-retry").send({
        productId: "product-123",
        quantity: 2,
      });

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "Temporary POST failure",
        attempt: 1,
      });
    });

    test("returns 503 on second attempt", async () => {
      await request(app).post("/test/post-retry").send({
        productId: "product-123",
      });

      const response = await request(app).post("/test/post-retry").send({
        productId: "product-456",
      });

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "Temporary POST failure",
        attempt: 2,
      });
    });

    test("returns 200 on third attempt and returns request body", async () => {
      await request(app).post("/test/post-retry").send({
        productId: "product-123",
      });

      await request(app).post("/test/post-retry").send({
        productId: "product-456",
      });

      const response = await request(app).post("/test/post-retry").send({
        productId: "product-789",
        quantity: 5,
      });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: "POST succeeded after retry",
        attempt: 3,
        received: {
          productId: "product-789",
          quantity: 5,
        },
      });
    });
  });

  describe("POST /test/post-retry/reset", () => {
    test("resets POST retry counter", async () => {
      await request(app).post("/test/post-retry").send({ test: true });

      await request(app).post("/test/post-retry").send({ test: true });

      const resetResponse = await request(app).post("/test/post-retry/reset");

      expect(resetResponse.status).toBe(200);

      expect(resetResponse.body).toEqual({
        success: true,
        message: "POST retry counter reset",
      });

      const response = await request(app).post("/test/post-retry").send({
        test: "after-reset",
      });

      expect(response.status).toBe(503);
      expect(response.body.attempt).toBe(1);
    });
  });

  describe("404 handling", () => {
    test("returns 404 for unknown GET route", async () => {
      const response = await request(app).get("/this-route-does-not-exist");

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        success: false,
        message: "Route not found.",
      });
    });

    test("returns 404 for unknown POST route", async () => {
      const response = await request(app).post("/unknown-post-route").send({
        test: true,
      });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        success: false,
        message: "Route not found.",
      });
    });

    test("calls notFound middleware", async () => {
      const { notFound } = require("@shopsphere/common");

      await request(app).get("/missing-route");

      expect(notFound).toHaveBeenCalled();
    });
  });
});
