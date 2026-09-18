const mockPostJson = jest.fn();
const mockRequest = jest.fn();

jest.mock("../../src/utils/serviceClient", () => ({
  postJson: mockPostJson,
  request: mockRequest,
}));

const {
  ingestProduct,
  deleteProduct,
} = require("../../src/services/rag.service");

describe("rag service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ingestProduct", () => {
    test("calls RAG ingest endpoint", async () => {
      mockPostJson.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          success: true,
        },
      });

      const result = await ingestProduct("product-123");

      expect(mockPostJson).toHaveBeenCalledWith(
        "http://localhost:5010",
        "/internal/products/product-123/ingest",
        {}
      );

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: {
          success: true,
        },
      });
    });

    test("returns failed RAG response", async () => {
      mockPostJson.mockResolvedValue({
        ok: false,
        status: 500,
        data: {
          message: "RAG failed",
        },
      });

      const result = await ingestProduct("product-123");

      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
    });

    test("returns null when RAG request throws", async () => {
      mockPostJson.mockRejectedValue(
        new Error("Connection failed")
      );

      await expect(
        ingestProduct("product-123")
      ).resolves.toBeNull();
    });
  });

  describe("deleteProduct", () => {
    test("calls RAG delete endpoint", async () => {
      mockRequest.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          success: true,
        },
      });

      const result = await deleteProduct("product-123");

      expect(mockRequest).toHaveBeenCalledWith(
        "http://localhost:5010",
        "/internal/products/product-123",
        {
          method: "DELETE",
        }
      );

      expect(result.ok).toBe(true);
    });

    test("returns failed delete response", async () => {
      mockRequest.mockResolvedValue({
        ok: false,
        status: 404,
        data: {
          message: "Not found",
        },
      });

      const result = await deleteProduct("product-123");

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });

    test("returns null when delete request throws", async () => {
      mockRequest.mockRejectedValue(
        new Error("RAG unavailable")
      );

      await expect(
        deleteProduct("product-123")
      ).resolves.toBeNull();
    });
  });
});