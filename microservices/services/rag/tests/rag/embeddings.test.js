jest.mock("@langchain/community/embeddings/hf", () => ({
  HuggingFaceInferenceEmbeddings: jest.fn().mockImplementation((config) => ({
    config,
  })),
}));

describe("RAG Embeddings", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("should create HuggingFaceInferenceEmbeddings with correct configuration", () => {
    process.env.HUGGINGFACEHUB_API_KEY = "test-hf-key";

    const {
      HuggingFaceInferenceEmbeddings,
    } = require("@langchain/community/embeddings/hf");

    const embeddings = require("../../src/rag/embeddings");

    expect(HuggingFaceInferenceEmbeddings).toHaveBeenCalledWith({
      apiKey: "test-hf-key",
      model: "BAAI/bge-base-en-v1.5",
      provider: "hf-inference",
    });

    expect(embeddings).toBeDefined();
    expect(embeddings.config).toEqual({
      apiKey: "test-hf-key",
      model: "BAAI/bge-base-en-v1.5",
      provider: "hf-inference",
    });
  });

  test("should allow undefined API key when environment variable is missing", () => {
    delete process.env.HUGGINGFACEHUB_API_KEY;

    const {
      HuggingFaceInferenceEmbeddings,
    } = require("@langchain/community/embeddings/hf");

    require("../../src/rag/embeddings");

    expect(HuggingFaceInferenceEmbeddings).toHaveBeenCalledWith({
      apiKey: undefined,
      model: "BAAI/bge-base-en-v1.5",
      provider: "hf-inference",
    });
  });
});