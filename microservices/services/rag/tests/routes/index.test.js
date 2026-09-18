const request = require("supertest");
const express = require("express");

jest.mock("@shopsphere/common", () => ({
  internal: jest.fn((req, res, next) => next()),
}));

jest.mock("../../src/controllers/rag.controller", () => ({
  qa: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: {
        answer: "The product costs ₹999.",
      },
    })
  ),

  ingest: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      message: "Product indexed.",
    })
  ),

  remove: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      message: "Product removed from index.",
    })
  ),
}));

const router = require("../../src/routes");
const controller = require("../../src/controllers/rag.controller");
const { internal } = require("@shopsphere/common");

describe("RAG routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(router);
  });

  describe("POST /internal/products/:id/qa", () => {
    test("should call QA controller", async () => {
      const response = await request(app)
        .post("/internal/products/product123/qa")
        .send({
          question: "What is the price?",
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          answer: "The product costs ₹999.",
        },
      });

      expect(controller.qa).toHaveBeenCalledTimes(1);
      expect(internal).toHaveBeenCalledTimes(1);
    });

    test("should pass product ID to the controller", async () => {
      await request(app)
        .post("/internal/products/product456/qa")
        .send({
          question: "Tell me about this product",
        });

      expect(controller.qa).toHaveBeenCalledTimes(1);

      const req = controller.qa.mock.calls[0][0];

      expect(req.params.id).toBe("product456");
      expect(req.body).toEqual({
        question: "Tell me about this product",
      });
    });
  });

  describe("POST /internal/products/:id/ingest", () => {
    test("should call ingest controller", async () => {
      const response = await request(app)
        .post("/internal/products/product123/ingest");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: "Product indexed.",
      });

      expect(controller.ingest).toHaveBeenCalledTimes(1);
      expect(internal).toHaveBeenCalledTimes(1);
    });

    test("should pass product ID to ingest controller", async () => {
      await request(app)
        .post("/internal/products/product789/ingest");

      expect(controller.ingest).toHaveBeenCalledTimes(1);

      const req = controller.ingest.mock.calls[0][0];

      expect(req.params.id).toBe("product789");
    });
  });

  describe("DELETE /internal/products/:id", () => {
    test("should call remove controller", async () => {
      const response = await request(app)
        .delete("/internal/products/product123");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: "Product removed from index.",
      });

      expect(controller.remove).toHaveBeenCalledTimes(1);
      expect(internal).toHaveBeenCalledTimes(1);
    });

    test("should pass product ID to remove controller", async () => {
      await request(app)
        .delete("/internal/products/product999");

      expect(controller.remove).toHaveBeenCalledTimes(1);

      const req = controller.remove.mock.calls[0][0];

      expect(req.params.id).toBe("product999");
    });
  });

  describe("Unknown routes", () => {
    test("should return 404 for an unsupported route", async () => {
      const response = await request(app)
        .get("/internal/products/product123/unknown");

      expect(response.status).toBe(404);
    });
  });
});