jest.mock("@langchain/community/vectorstores/chroma", () => ({
  Chroma: jest.fn().mockImplementation((embeddings, config) => ({
    embeddings,
    config,
  })),
}));

jest.mock("chromadb", () => ({
  CloudClient: jest.fn().mockImplementation((config) => ({
    config,
  })),
}));

jest.mock("../../src/rag/embeddings", () => ({
  embedDocuments: jest.fn(),
  embedQuery: jest.fn(),
}));

describe("Vector Store", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("should throw when CHROMA_API_KEY is missing", async () => {
    delete process.env.CHROMA_API_KEY;
    process.env.CHROMA_TENANT = "tenant";
    process.env.CHROMA_DATABASE = "database";

    const { getVectorStore } = require("../../src/rag/vectorStore");

    await expect(getVectorStore()).rejects.toThrow(
      "CHROMA_API_KEY is not configured"
    );
  });

  test("should throw when CHROMA_TENANT is missing", async () => {
    process.env.CHROMA_API_KEY = "api-key";
    delete process.env.CHROMA_TENANT;
    process.env.CHROMA_DATABASE = "database";

    const { getVectorStore } = require("../../src/rag/vectorStore");

    await expect(getVectorStore()).rejects.toThrow(
      "CHROMA_TENANT is not configured"
    );
  });

  test("should throw when CHROMA_DATABASE is missing", async () => {
    process.env.CHROMA_API_KEY = "api-key";
    process.env.CHROMA_TENANT = "tenant";
    delete process.env.CHROMA_DATABASE;

    const { getVectorStore } = require("../../src/rag/vectorStore");

    await expect(getVectorStore()).rejects.toThrow(
      "CHROMA_DATABASE is not configured"
    );
  });

  test("should create Chroma Cloud vector store with correct configuration", async () => {
    process.env.CHROMA_API_KEY = "api-key";
    process.env.CHROMA_TENANT = "tenant";
    process.env.CHROMA_DATABASE = "database";

    const {
      Chroma,
    } = require("@langchain/community/vectorstores/chroma");

    const {
      CloudClient,
    } = require("chromadb");

    const embeddings = require("../../src/rag/embeddings");
    const { getVectorStore } = require("../../src/rag/vectorStore");

    const result = await getVectorStore();

    expect(CloudClient).toHaveBeenCalledWith({
      apiKey: "api-key",
      tenant: "tenant",
      database: "database",
    });

    expect(Chroma).toHaveBeenCalledWith(
      embeddings,
      {
        collectionName: "shopsphere-products",
        index: expect.objectContaining({
          config: {
            apiKey: "api-key",
            tenant: "tenant",
            database: "database",
          },
        }),
      }
    );

    expect(result).toBeDefined();
    expect(result.config.collectionName).toBe(
      "shopsphere-products"
    );
  });

  test("should return the cached vector store on subsequent calls", async () => {
    process.env.CHROMA_API_KEY = "api-key";
    process.env.CHROMA_TENANT = "tenant";
    process.env.CHROMA_DATABASE = "database";

    const {
      Chroma,
    } = require("@langchain/community/vectorstores/chroma");

    const {
      CloudClient,
    } = require("chromadb");

    const { getVectorStore } = require("../../src/rag/vectorStore");

    const first = await getVectorStore();
    const second = await getVectorStore();

    expect(second).toBe(first);

    expect(CloudClient).toHaveBeenCalledTimes(1);
    expect(Chroma).toHaveBeenCalledTimes(1);
  });
});