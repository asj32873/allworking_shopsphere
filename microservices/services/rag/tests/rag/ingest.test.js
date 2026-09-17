jest.mock("../../src/rag/vectorStore", () => ({
  getVectorStore: jest.fn(),
}));

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

const { Document } = require("@langchain/core/documents");

const {
  getVectorStore,
} = require("../../src/rag/vectorStore");

const {
  getJson,
} = require("../../src/utils/serviceClient");

const {
  buildProductDocument,
  ingestProduct,
  ingestAllProducts,
  deleteProductFromVectorStore,
} = require("../../src/rag/ingest");

describe("RAG ingest", () => {
  let vectorStore;
  let consoleLogSpy;
  let consoleErrorSpy;

  const product = {
    _id: "product123",
    name: "iPhone 15",
    brand: "Apple",
    category: "Smartphones",
    price: 70000,
    stock: 10,
    rating: 4.5,
    reviewCount: 2,
    description: "A powerful smartphone.",
  };

  const reviews = [
    {
      rating: 5,
      review: "Excellent phone.",
    },
    {
      rating: 4,
      review: "Very good phone.",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    vectorStore = {
      delete: jest.fn().mockResolvedValue(undefined),
      addDocuments: jest.fn().mockResolvedValue(undefined),
    };

    getVectorStore.mockResolvedValue(vectorStore);

    consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("buildProductDocument", () => {
    test("should build product document", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: product,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: reviews,
          },
        });

      const result = await buildProductDocument("product123");

      expect(result).toBeInstanceOf(Document);

      expect(result.metadata.productId).toBe(
        "product123"
      );

      expect(result.metadata.type).toBe("product");
      expect(result.metadata.name).toBe("iPhone 15");
      expect(result.metadata.brand).toBe("Apple");
      expect(result.metadata.category).toBe("Smartphones");

      expect(result.pageContent).toContain(
        "Product Name: iPhone 15"
      );

      expect(result.pageContent).toContain(
        "Brand: Apple"
      );

      expect(result.pageContent).toContain(
        "Category: Smartphones"
      );

      expect(result.pageContent).toContain(
        "Price: ₹70000"
      );

      expect(result.pageContent).toContain(
        "Stock: 10"
      );

      expect(result.pageContent).toContain(
        "Rating: 4.5/5"
      );

      expect(result.pageContent).toContain(
        "Review Count: 2"
      );

      expect(result.pageContent).toContain(
        "Excellent phone."
      );

      expect(result.pageContent).toContain(
        "Very good phone."
      );

      expect(getJson).toHaveBeenCalledTimes(2);
    });

    test("should throw when product is not found", async () => {
      getJson.mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        buildProductDocument("missing-product")
      ).rejects.toThrow("Product not found");

      expect(getJson).toHaveBeenCalledTimes(1);
    });

    test("should handle missing reviews", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: {
              ...product,
              rating: undefined,
              reviewCount: undefined,
            },
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {},
        });

      const result = await buildProductDocument(
        "product123"
      );

      expect(result.pageContent).toContain(
        "Rating: 0/5"
      );

      expect(result.pageContent).toContain(
        "Review Count: 0"
      );

      expect(result.pageContent).toContain(
        "No reviews available."
      );
    });
  });

  describe("ingestProduct", () => {
    test("should ingest a product", async () => {
      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: product,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: reviews,
          },
        });

      const result = await ingestProduct("product123");

      expect(result).toBeInstanceOf(Document);

      expect(
        vectorStore.delete
      ).toHaveBeenCalledTimes(1);

      expect(
        vectorStore.addDocuments
      ).toHaveBeenCalledTimes(1);

      expect(
        vectorStore.addDocuments.mock.calls[0][0]
      ).toHaveLength(1);
    });

    test("should continue when deleting old document fails", async () => {
      vectorStore.delete.mockRejectedValueOnce(
        new Error("Delete failed")
      );

      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: product,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: reviews,
          },
        });

      const result = await ingestProduct("product123");

      expect(result).toBeInstanceOf(Document);

      expect(
        vectorStore.delete
      ).toHaveBeenCalledTimes(1);

      expect(
        vectorStore.addDocuments
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteProductFromVectorStore", () => {
    test("should delete product", async () => {
      await deleteProductFromVectorStore(
        "product123"
      );

      expect(getVectorStore).toHaveBeenCalledTimes(1);

      expect(vectorStore.delete).toHaveBeenCalledWith({
        ids: ["product-product123"],
      });
    });

    test("should handle delete failure", async () => {
      vectorStore.delete.mockRejectedValueOnce(
        new Error("Delete failed")
      );

      await expect(
        deleteProductFromVectorStore("product123")
      ).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("ingestAllProducts", () => {
    test("should ingest all products", async () => {
      const product2 = {
        ...product,
        _id: "product456",
        name: "MacBook Air",
      };

      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              { _id: "product123" },
              { _id: "product456" },
            ],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: product,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: reviews,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: product2,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [],
          },
        });

      await ingestAllProducts();

      expect(
        vectorStore.addDocuments
      ).toHaveBeenCalledTimes(2);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Starting product ingestion..."
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Found 2 products to ingest."
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Product ingestion completed."
      );
    });

    test("should throw when product service fails", async () => {
      getJson.mockResolvedValueOnce({
        ok: false,
        data: {
          message: "Product service unavailable",
        },
      });

      await expect(
        ingestAllProducts()
      ).rejects.toThrow(
        "Product service unavailable"
      );

      expect(
        vectorStore.addDocuments
      ).not.toHaveBeenCalled();
    });

    test("should continue when one product fails", async () => {
      const product2 = {
        ...product,
        _id: "product456",
        name: "MacBook Air",
      };

      getJson
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [
              { _id: "product123" },
              { _id: "product456" },
            ],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: product,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: reviews,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: product2,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            data: [],
          },
        });

      vectorStore.addDocuments
        .mockRejectedValueOnce(
          new Error("Ingestion failed")
        )
        .mockResolvedValueOnce(undefined);

      await ingestAllProducts();

      expect(
        vectorStore.addDocuments
      ).toHaveBeenCalledTimes(2);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "✗ Failed to ingest product product123:",
        "Ingestion failed"
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Product ingestion completed."
      );
    });

    test("should handle empty product list", async () => {
      getJson.mockResolvedValueOnce({
        ok: true,
        data: {
          data: [],
        },
      });

      await ingestAllProducts();

      expect(
        vectorStore.addDocuments
      ).not.toHaveBeenCalled();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Found 0 products to ingest."
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Product ingestion completed."
      );
    });
  });
});