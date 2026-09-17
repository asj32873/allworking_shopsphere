// tests/server.test.js

const request = require("supertest");

const { fixRequestBody } = require("http-proxy-middleware");
/*
 * -------------------------------------------------------
 * MOCK HTTP PROXY MIDDLEWARE
 * -------------------------------------------------------
 *
 * We don't want Jest tests to actually call:
 *
 *   auth service
 *   user service
 *   product service
 *   payment service
 *   etc.
 *
 * Instead, capture the proxy configuration and return a
 * fake middleware that behaves like an upstream service.
 */

const proxyConfigs = [];

jest.mock("http-proxy-middleware", () => ({
  createProxyMiddleware: jest.fn((options) => {
    proxyConfigs.push(options);

    return jest.fn((req, res) => {
      res.status(200).json({
        success: true,
        mocked: true,
        method: req.method,
        path: req.originalUrl,
      });
    });
  }),

  fixRequestBody: jest.fn(),
}));

/*
 * -------------------------------------------------------
 * ENVIRONMENT
 * -------------------------------------------------------
 */

process.env.NODE_ENV = "test";

process.env.FRONTEND_URL = "http://localhost:5173";

process.env.AUTH_SERVICE_URL = "http://localhost:5002";
process.env.USER_SERVICE_URL = "http://localhost:5007";
process.env.PRODUCT_SERVICE_URL = "http://localhost:5003";
process.env.CART_SERVICE_URL = "http://localhost:5004";
process.env.ORDER_SERVICE_URL = "http://localhost:5005";
process.env.PAYMENT_SERVICE_URL = "http://localhost:5006";
process.env.ADDRESS_SERVICE_URL = "http://localhost:5008";
process.env.REVIEW_SERVICE_URL = "http://localhost:5009";
process.env.RAG_SERVICE_URL = "http://localhost:5010";
process.env.SUPPORT_SERVICE_URL = "http://localhost:5011";
process.env.VENDOR_SERVICE_URL = "http://localhost:5012";
process.env.ADMIN_SERVICE_URL = "http://localhost:5013";

/*
 * server.js only calls app.listen() when:
 *
 * require.main === module
 *
 * Therefore requiring it from Jest does not start a
 * real HTTP server.
 */

const app = require("../src/server");

/*
 * -------------------------------------------------------
 * TESTS
 * -------------------------------------------------------
 */

describe("ShopSphere API Gateway", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fixRequestBody.mockClear();
  });

  /*
   * -----------------------------------------------------
   * HEALTH
   * -----------------------------------------------------
   */

  describe("Health endpoints", () => {
    test("GET /health returns gateway health", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.service).toBe("shopsphere-api-gateway");

      expect(response.body.timestamp).toBeDefined();
    });

    test("GET /api/health returns gateway health", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.service).toBe("shopsphere-api-gateway");

      expect(response.body.timestamp).toBeDefined();
    });
  });

  /*
   * -----------------------------------------------------
   * 404
   * -----------------------------------------------------
   */

  describe("404 handling", () => {
    test("returns 404 for an unknown route", async () => {
      const response = await request(app).get("/this-route-does-not-exist");

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Gateway route not found.");

      expect(response.body.path).toBe("/this-route-does-not-exist");
    });

    test("returns 404 for unknown API route", async () => {
      const response = await request(app).get("/api/unknown-service");

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe("Gateway route not found.");

      expect(response.body.path).toBe("/api/unknown-service");
    });
  });

  /*
   * -----------------------------------------------------
   * AUTH ROUTE
   * -----------------------------------------------------
   */

  describe("Auth proxy", () => {
    test("GET /api/auth reaches auth proxy", async () => {
      const response = await request(app).get("/api/auth/test");

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.mocked).toBe(true);

      expect(response.body.method).toBe("GET");

      expect(response.body.path).toBe("/api/auth/test");
    });
  });

  /*
   * -----------------------------------------------------
   * USERS ROUTE
   * -----------------------------------------------------
   */

  describe("Users proxy", () => {
    test("GET /api/users reaches users proxy", async () => {
      const response = await request(app).get("/api/users/test");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);

      expect(response.body.path).toBe("/api/users/test");
    });
  });

  /*
   * -----------------------------------------------------
   * PRODUCTS ROUTE
   * -----------------------------------------------------
   */

  describe("Products proxy", () => {
    test("GET /api/products reaches products proxy", async () => {
      const response = await request(app).get("/api/products");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);

      expect(response.body.path).toBe("/api/products");
    });
  });

  /*
   * -----------------------------------------------------
   * CART ROUTE
   * -----------------------------------------------------
   */

  describe("Cart proxy", () => {
    test("GET /api/cart reaches cart proxy", async () => {
      const response = await request(app).get("/api/cart");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("POST /api/cart reaches cart proxy", async () => {
      const response = await request(app).post("/api/cart").send({
        productId: "product-123",
        quantity: 2,
      });

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);

      expect(response.body.method).toBe("POST");
    });
  });

  /*
   * -----------------------------------------------------
   * ORDERS ROUTE
   * -----------------------------------------------------
   */

  describe("Orders proxy", () => {
    test("GET /api/orders reaches orders proxy", async () => {
      const response = await request(app).get("/api/orders");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("POST /api/orders reaches orders proxy", async () => {
      const response = await request(app).post("/api/orders").send({
        items: [],
      });

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("POST");
    });
  });

  /*
   * -----------------------------------------------------
   * PAYMENTS ROUTE
   * -----------------------------------------------------
   */

  describe("Payments proxy", () => {
    test("GET /api/payments reaches payment proxy", async () => {
      const response = await request(app).get("/api/payments");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("POST /api/payments reaches payment proxy", async () => {
      const response = await request(app).post("/api/payments").send({
        amount: 1000,
      });

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("POST");
    });
  });

  /*
   * -----------------------------------------------------
   * ADDRESS ROUTE
   * -----------------------------------------------------
   */

  describe("Addresses proxy", () => {
    test("GET /api/addresses reaches address proxy", async () => {
      const response = await request(app).get("/api/addresses");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("POST /api/addresses reaches address proxy", async () => {
      const response = await request(app).post("/api/addresses").send({
        type: "Home",
        addressLine: "123 Main Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      });

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("POST");
    });
  });

  /*
   * -----------------------------------------------------
   * REVIEWS ROUTE
   * -----------------------------------------------------
   */

  describe("Reviews proxy", () => {
    test("GET /api/reviews reaches reviews proxy", async () => {
      const response = await request(app).get("/api/reviews");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });
  });

  /*
   * -----------------------------------------------------
   * RAG ROUTE
   * -----------------------------------------------------
   */

  describe("RAG proxy", () => {
    test("GET /api/rag reaches RAG proxy", async () => {
      const response = await request(app).get("/api/rag");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("POST /api/rag reaches RAG proxy", async () => {
      const response = await request(app).post("/api/rag").send({
        query: "Find running shoes",
      });

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("POST");
    });
  });

  /*
   * -----------------------------------------------------
   * SUPPORT / ISSUES ROUTE
   * -----------------------------------------------------
   */

  describe("Issues proxy", () => {
    test("GET /api/issues reaches support proxy", async () => {
      const response = await request(app).get("/api/issues");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("POST /api/issues reaches support proxy", async () => {
      const response = await request(app).post("/api/issues").send({
        subject: "Payment problem",
      });

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("POST");
    });
  });

  /*
   * -----------------------------------------------------
   * VENDOR ROUTE
   * -----------------------------------------------------
   */

  describe("Vendor proxy", () => {
    test("GET /api/vendor reaches vendor proxy", async () => {
      const response = await request(app).get("/api/vendor");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });
  });

  /*
   * -----------------------------------------------------
   * ADMIN ROUTE
   * -----------------------------------------------------
   */

  describe("Admin proxy", () => {
    test("GET /api/admin reaches admin proxy", async () => {
      const response = await request(app).get("/api/admin");

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });
  });

  /*
   * -----------------------------------------------------
   * PAYMENT DEBUG
   * -----------------------------------------------------
   */

  describe("Payment debug route", () => {
    test("POST /api/payment-debug works", async () => {
      const response = await request(app).post("/api/payment-debug");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: "Gateway payment debug route works",
      });
    });
  });

  /*
   * -----------------------------------------------------
   * HTTP METHODS
   * -----------------------------------------------------
   */

  describe("HTTP methods", () => {
    test("PUT request is accepted by gateway", async () => {
      const response = await request(app)
        .put("/api/products/product-123")
        .send({
          name: "Updated product",
        });

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("PUT");
    });

    test("PATCH request is accepted by gateway", async () => {
      const response = await request(app)
        .patch("/api/products/product-123")
        .send({
          price: 999,
        });

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("PATCH");
    });

    test("DELETE request is accepted by gateway", async () => {
      const response = await request(app).delete("/api/products/product-123");

      expect(response.status).toBe(200);

      expect(response.body.method).toBe("DELETE");
    });
  });

  /*
   * -----------------------------------------------------
   * REQUEST BODY
   * -----------------------------------------------------
   */

  describe("Request body parsing", () => {
    test("parses JSON request body", async () => {
      const response = await request(app).post("/api/products").send({
        name: "Running Shoes",
        price: 2999,
      });

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("accepts URL encoded requests", async () => {
      const response = await request(app)
        .post("/api/products")
        .type("form")
        .send({
          name: "Running Shoes",
        });

      expect(response.status).toBe(200);
    });
  });

  /*
   * -----------------------------------------------------
   * STRIPE WEBHOOK
   * -----------------------------------------------------
   */

  describe("Stripe webhook", () => {
    test("webhook route is registered before normal JSON middleware", async () => {
      const response = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "test-stripe-signature")
        .set("content-type", "application/json")
        .send(
          JSON.stringify({
            type: "payment_intent.succeeded",
          }),
        );

      expect(response.status).toBe(200);

      expect(response.body.mocked).toBe(true);
    });

    test("accepts Stripe signature header", async () => {
      const response = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "t=123,v1=test-signature")
        .send({
          type: "checkout.session.completed",
        });

      expect(response.status).toBe(200);
    });
  });

  /*
   * -----------------------------------------------------
   * PROXY CONFIGURATION
   * -----------------------------------------------------
   */

  describe("Proxy configuration", () => {
    test("creates proxy middleware for all services", () => {
      /*
       * 12 normal services + 1 Stripe webhook proxy.
       */

      expect(proxyConfigs.length).toBeGreaterThanOrEqual(13);
    });

    test("auth proxy uses correct target", () => {
      const authProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5002",
      );

      expect(authProxy).toBeDefined();

      expect(authProxy.changeOrigin).toBe(true);

      expect(authProxy.proxyTimeout).toBe(75000);

      expect(authProxy.pathRewrite).toEqual({
        "^/": "/api/auth/",
      });
    });

    test("users proxy uses correct target", () => {
      const usersProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5007",
      );

      expect(usersProxy).toBeDefined();

      expect(usersProxy.changeOrigin).toBe(true);

      expect(usersProxy.pathRewrite).toEqual({
        "^/": "/api/users/",
      });
    });

    test("products proxy uses correct target", () => {
      const productsProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5003",
      );

      expect(productsProxy).toBeDefined();

      expect(productsProxy.changeOrigin).toBe(true);

      expect(productsProxy.pathRewrite).toEqual({
        "^/": "/api/products/",
      });
    });

    test("cart proxy uses correct target", () => {
      const cartProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5004",
      );

      expect(cartProxy).toBeDefined();

      expect(cartProxy.pathRewrite).toEqual({
        "^/": "/api/cart/",
      });
    });

    test("orders proxy uses correct target", () => {
      const ordersProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5005",
      );

      expect(ordersProxy).toBeDefined();

      expect(ordersProxy.pathRewrite).toEqual({
        "^/": "/api/orders/",
      });
    });

    it("payments proxy uses correct target", () => {
      const paymentsProxy = proxyConfigs.find(
        (config) =>
          config.target === "http://localhost:5006" &&
          config.pathRewrite &&
          config.pathRewrite["^/"] === "/api/payments/",
      );

      expect(paymentsProxy).toBeDefined();

      expect(paymentsProxy.target).toBe("http://localhost:5006");

      expect(paymentsProxy.pathRewrite).toEqual({
        "^/": "/api/payments/",
      });
    });

    test("addresses proxy uses correct target", () => {
      const addressesProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5008",
      );

      expect(addressesProxy).toBeDefined();

      expect(addressesProxy.pathRewrite).toEqual({
        "^/": "/api/addresses/",
      });
    });

    test("reviews proxy uses correct target", () => {
      const reviewsProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5009",
      );

      expect(reviewsProxy).toBeDefined();

      expect(reviewsProxy.pathRewrite).toEqual({
        "^/": "/api/reviews/",
      });
    });

    test("RAG proxy uses correct target", () => {
      const ragProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5010",
      );

      expect(ragProxy).toBeDefined();

      expect(ragProxy.pathRewrite).toEqual({
        "^/": "/api/rag/",
      });
    });

    test("issues proxy uses correct target", () => {
      const issuesProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5011",
      );

      expect(issuesProxy).toBeDefined();

      expect(issuesProxy.pathRewrite).toEqual({
        "^/": "/api/issues/",
      });
    });

    test("vendor proxy uses correct target", () => {
      const vendorProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5012",
      );

      expect(vendorProxy).toBeDefined();

      expect(vendorProxy.pathRewrite).toEqual({
        "^/": "/api/vendor/",
      });
    });

    test("admin proxy uses correct target", () => {
      const adminProxy = proxyConfigs.find(
        (config) => config.target === "http://localhost:5013",
      );

      expect(adminProxy).toBeDefined();

      expect(adminProxy.pathRewrite).toEqual({
        "^/": "/api/admin/",
      });
    });
  });

  /*
   * -----------------------------------------------------
   * STRIPE PROXY CONFIGURATION
   * -----------------------------------------------------
   */

  describe("Stripe proxy configuration", () => {
    test("Stripe webhook uses payment service", () => {
      const stripeProxy = proxyConfigs.find(
        (config) =>
          config.target === "http://localhost:5006" &&
          config.pathRewrite &&
          config.pathRewrite["^/"] === "/api/payments/webhook",
      );

      expect(stripeProxy).toBeDefined();

      expect(stripeProxy.changeOrigin).toBe(true);

      expect(stripeProxy.proxyTimeout).toBe(15000);
    });

    test("Stripe proxy has proxyReq handler", () => {
      const stripeProxy = proxyConfigs.find(
        (config) =>
          config.target === "http://localhost:5006" &&
          config.pathRewrite &&
          config.pathRewrite["^/"] === "/api/payments/webhook",
      );

      expect(stripeProxy).toBeDefined();

      expect(stripeProxy.on).toBeDefined();

      expect(stripeProxy.on.proxyReq).toBeDefined();

      expect(typeof stripeProxy.on.proxyReq).toBe("function");
    });

    test("Stripe proxy has error handler", () => {
      const stripeProxy = proxyConfigs.find(
        (config) =>
          config.target === "http://localhost:5006" &&
          config.pathRewrite &&
          config.pathRewrite["^/"] === "/api/payments/webhook",
      );

      expect(stripeProxy).toBeDefined();

      expect(stripeProxy.on.error).toBeDefined();

      expect(typeof stripeProxy.on.error).toBe("function");
    });
  });

  /*
   * -----------------------------------------------------
   * SECURITY HEADERS
   * -----------------------------------------------------
   */

  describe("Security middleware", () => {
    test("Helmet adds security headers", async () => {
      const response = await request(app).get("/health");

      expect(response.headers).toHaveProperty("x-content-type-options");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
    });

    test("CORS header is returned for configured frontend", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:5173");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173",
      );

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  /*
   * -----------------------------------------------------
   * RATE LIMIT
   * -----------------------------------------------------
   */

  describe("Rate limiting", () => {
    test("API requests pass through rate limiter", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);

      expect(response.headers["ratelimit-limit"]).toBeDefined();

      expect(response.headers["ratelimit-remaining"]).toBeDefined();
    });
  });
  /*
   * -----------------------------------------------------
   * PROXY CALLBACK COVERAGE
   *
   * These tests directly execute the callbacks configured
   * inside http-proxy-middleware.
   * -----------------------------------------------------
   */

  describe("Proxy callback coverage", () => {
    function getProxyConfig(path) {
      return proxyConfigs.find(
        (config) => config.pathRewrite && config.pathRewrite["^/"] === path,
      );
    }

    function createProxyRequest() {
      return {
        setHeader: jest.fn(),
      };
    }

    function createResponse(headersSent = false) {
      return {
        headersSent,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    }

    test("normal proxyReq sets gateway header and fixes parsed body", () => {
      const proxyConfig = getProxyConfig("/api/products/");

      expect(proxyConfig).toBeDefined();
      expect(proxyConfig.on.proxyReq).toBeDefined();

      const proxyReq = createProxyRequest();

      const req = {
        method: "POST",
        originalUrl: "/api/products",
        url: "/",
        body: {
          name: "Running Shoes",
          price: 2999,
        },
      };

      proxyConfig.on.proxyReq(proxyReq, req);

      expect(proxyReq.setHeader).toHaveBeenCalledWith(
        "x-gateway-request",
        "shopsphere",
      );

      expect(fixRequestBody).toHaveBeenCalledWith(proxyReq, req);
    });

    test("normal proxyReq skips fixRequestBody when body is absent", () => {
      const proxyConfig = getProxyConfig("/api/products/");

      expect(proxyConfig).toBeDefined();

      const proxyReq = createProxyRequest();

      const req = {
        method: "GET",
        originalUrl: "/api/products",
        url: "/",
        body: undefined,
      };

      proxyConfig.on.proxyReq(proxyReq, req);

      expect(proxyReq.setHeader).toHaveBeenCalledWith(
        "x-gateway-request",
        "shopsphere",
      );

      expect(fixRequestBody).not.toHaveBeenCalled();
    });

    test("normal proxyReq skips fixRequestBody when body is not an object", () => {
      const proxyConfig = getProxyConfig("/api/products/");

      expect(proxyConfig).toBeDefined();

      const proxyReq = createProxyRequest();

      const req = {
        method: "GET",
        originalUrl: "/api/products",
        url: "/",
        body: "plain-text",
      };

      proxyConfig.on.proxyReq(proxyReq, req);

      expect(proxyReq.setHeader).toHaveBeenCalledWith(
        "x-gateway-request",
        "shopsphere",
      );

      expect(fixRequestBody).not.toHaveBeenCalled();
    });

    test("normal proxyRes logs successful upstream response", () => {
      const proxyConfig = getProxyConfig("/api/products/");

      expect(proxyConfig).toBeDefined();
      expect(proxyConfig.on.proxyRes).toBeDefined();

      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const proxyRes = {
        statusCode: 200,
      };

      const req = {
        method: "GET",
        originalUrl: "/api/products",
      };

      proxyConfig.on.proxyRes(proxyRes, req);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("normal proxy error returns 502 response", () => {
      const proxyConfig = getProxyConfig("/api/products/");

      expect(proxyConfig).toBeDefined();
      expect(proxyConfig.on.error).toBeDefined();

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const proxyReq = createProxyRequest();

      const req = {
        method: "GET",
        originalUrl: "/api/products",
      };

      const res = createResponse(false);

      const error = new Error("Connection refused");

      proxyConfig.on.error(error, req, res);

      expect(consoleSpy).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(502);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Upstream service unavailable.",
        error: "Connection refused",
      });

      consoleSpy.mockRestore();
    });

    test("normal proxy error does not send response when headers are already sent", () => {
      const proxyConfig = getProxyConfig("/api/products/");

      expect(proxyConfig).toBeDefined();

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const req = {
        method: "GET",
        originalUrl: "/api/products",
      };

      const res = createResponse(true);

      const error = new Error("Connection refused");

      proxyConfig.on.error(error, req, res);

      expect(consoleSpy).toHaveBeenCalled();

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("Stripe proxyReq forwards Stripe signature", () => {
      const stripeConfig = getProxyConfig("/api/payments/webhook");

      expect(stripeConfig).toBeDefined();
      expect(stripeConfig.on.proxyReq).toBeDefined();

      const proxyReq = createProxyRequest();

      const req = {
        headers: {
          "stripe-signature": "t=123,v1=test-signature",
        },
      };

      stripeConfig.on.proxyReq(proxyReq, req);

      expect(proxyReq.setHeader).toHaveBeenCalledWith(
        "stripe-signature",
        "t=123,v1=test-signature",
      );

      expect(proxyReq.setHeader).toHaveBeenCalledWith(
        "x-gateway-request",
        "shopsphere",
      );
    });

    test("Stripe proxyReq works without Stripe signature", () => {
      const stripeConfig = getProxyConfig("/api/payments/webhook");

      expect(stripeConfig).toBeDefined();

      const proxyReq = createProxyRequest();

      const req = {
        headers: {},
      };

      stripeConfig.on.proxyReq(proxyReq, req);

      expect(proxyReq.setHeader).not.toHaveBeenCalledWith(
        "stripe-signature",
        expect.anything(),
      );

      expect(proxyReq.setHeader).toHaveBeenCalledWith(
        "x-gateway-request",
        "shopsphere",
      );
    });

    test("Stripe proxy error returns 502 response", () => {
      const stripeConfig = getProxyConfig("/api/payments/webhook");

      expect(stripeConfig).toBeDefined();
      expect(stripeConfig.on.error).toBeDefined();

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const req = {
        method: "POST",
        originalUrl: "/api/payments/webhook",
      };

      const res = createResponse(false);

      const error = new Error("Stripe service unavailable");

      stripeConfig.on.error(error, req, res);

      expect(consoleSpy).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(502);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Payment service unavailable.",
      });

      consoleSpy.mockRestore();
    });

    test("Stripe proxy error does not send response when headers are already sent", () => {
      const stripeConfig = getProxyConfig("/api/payments/webhook");

      expect(stripeConfig).toBeDefined();

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const req = {
        method: "POST",
        originalUrl: "/api/payments/webhook",
      };

      const res = createResponse(true);

      const error = new Error("Stripe service unavailable");

      stripeConfig.on.error(error, req, res);

      expect(consoleSpy).toHaveBeenCalled();

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
  describe("Server startup", () => {
    test("startServer starts the gateway on the configured port", () => {
      const listenSpy = jest
        .spyOn(app, "listen")
        .mockImplementation((port, host, callback) => {
          callback();
          return { close: jest.fn() };
        });

      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      app.startServer();

      expect(listenSpy).toHaveBeenCalledWith(
        5001,
        "0.0.0.0",
        expect.any(Function),
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "ShopSphere API Gateway running on http://localhost:5001",
      );

      listenSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
