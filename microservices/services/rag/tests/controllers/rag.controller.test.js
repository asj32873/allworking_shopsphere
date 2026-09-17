const { qa, ingest, remove } = require("../../src/controllers/rag.controller");

const graph = require("../../src/rag/graph");
const {
  ingestProduct,
  deleteProductFromVectorStore,
} = require("../../src/rag/ingest");

const { ok, fail } = require("../../src/utils/apiResponse");

jest.mock("../../src/rag/graph", () => ({
  invoke: jest.fn(),
}));

jest.mock("../../src/rag/ingest", () => ({
  ingestProduct: jest.fn(),
  deleteProductFromVectorStore: jest.fn(),
}));

jest.mock("../../src/utils/apiResponse", () => ({
  ok: jest.fn(),
  fail: jest.fn(),
}));

describe("RAG Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {
        id: "product-123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("qa", () => {
    test("should reject when question is missing", async () => {
      req.body = {};

      await qa(req, res);

      expect(fail).toHaveBeenCalledWith(
        res,
        "Question is required."
      );

      expect(graph.invoke).not.toHaveBeenCalled();
    });

    test("should reject when question is shorter than two characters", async () => {
      req.body = {
        question: "a",
      };

      await qa(req, res);

      expect(fail).toHaveBeenCalledWith(
        res,
        "Question is required."
      );

      expect(graph.invoke).not.toHaveBeenCalled();
    });

    test("should invoke graph with trimmed question and product ID", async () => {
      req.body = {
        question: "  What is the price?  ",
      };

      graph.invoke.mockResolvedValue({
        answer: "The price is ₹999.",
      });

      await qa(req, res);

      expect(graph.invoke).toHaveBeenCalledWith({
        question: "What is the price?",
        productId: "product-123",
      });
    });

    test("should return the generated answer", async () => {
      req.body = {
        question: "What is the price?",
      };

      graph.invoke.mockResolvedValue({
        answer: "The price is ₹999.",
      });

      await qa(req, res);

      expect(ok).toHaveBeenCalledWith(res, {
        answer: "The price is ₹999.",
      });
    });

    test("should propagate graph errors", async () => {
      req.body = {
        question: "What is the price?",
      };

      graph.invoke.mockRejectedValue(
        new Error("Graph failure")
      );

      await expect(qa(req, res)).rejects.toThrow(
        "Graph failure"
      );

      expect(ok).not.toHaveBeenCalled();
    });
  });

  describe("ingest", () => {
    test("should ingest the requested product", async () => {
      ingestProduct.mockResolvedValue(undefined);

      await ingest(req, res);

      expect(ingestProduct).toHaveBeenCalledWith(
        "product-123"
      );
    });

    test("should return product indexed response", async () => {
      ingestProduct.mockResolvedValue(undefined);

      await ingest(req, res);

      expect(ok).toHaveBeenCalledWith(
        res,
        null,
        "Product indexed."
      );
    });

    test("should propagate ingestion errors", async () => {
      ingestProduct.mockRejectedValue(
        new Error("Ingestion failed")
      );

      await expect(ingest(req, res)).rejects.toThrow(
        "Ingestion failed"
      );

      expect(ok).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    test("should remove the requested product from vector store", async () => {
      deleteProductFromVectorStore.mockResolvedValue(undefined);

      await remove(req, res);

      expect(deleteProductFromVectorStore).toHaveBeenCalledWith(
        "product-123"
      );
    });

    test("should return product removed response", async () => {
      deleteProductFromVectorStore.mockResolvedValue(undefined);

      await remove(req, res);

      expect(ok).toHaveBeenCalledWith(
        res,
        null,
        "Product removed from index."
      );
    });

    test("should propagate removal errors", async () => {
      deleteProductFromVectorStore.mockRejectedValue(
        new Error("Removal failed")
      );

      await expect(remove(req, res)).rejects.toThrow(
        "Removal failed"
      );

      expect(ok).not.toHaveBeenCalled();
    });
  });
});