jest.mock("../../src/rag/vectorStore", () => ({
  getVectorStore: jest.fn(),
}));

jest.mock("../../src/utils/hfClient", () => ({
  generateAnswer: jest.fn(),
}));

jest.mock("@langchain/langgraph", () => {
  const nodes = {};

  const graph = {
    addNode: jest.fn((name, fn) => {
      nodes[name] = fn;
      return graph;
    }),
    addEdge: jest.fn(() => graph),
    compile: jest.fn(() => ({
      invoke: async (state) => {
        const retrieved = await nodes.retrieve(state);
        const generated = await nodes.generate({
          ...state,
          ...retrieved,
        });

        return {
          ...state,
          ...retrieved,
          ...generated,
        };
      },
    })),
  };

  return {
    StateGraph: jest.fn(() => graph),
    StateSchema: jest.fn((schema) => schema),
    START: "__start__",
    END: "__end__",
  };
});

jest.mock("zod", () => ({
  z: {
    string: jest.fn(() => ({
      default: jest.fn(() => "default"),
    })),
  },
}));

const { getVectorStore } = require("../../src/rag/vectorStore");
const { generateAnswer } = require("../../src/utils/hfClient");

const graph = require("../../src/rag/graph");

describe("RAG Graph", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should retrieve product context and generate an answer", async () => {
    const similaritySearch = jest.fn().mockResolvedValue([
      {
        pageContent: "Product Name: iPhone 15",
      },
      {
        pageContent: "Price: ₹69999",
      },
    ]);

    getVectorStore.mockResolvedValue({
      similaritySearch,
    });

    generateAnswer.mockResolvedValue(
      "The iPhone 15 costs ₹69999."
    );

    const result = await graph.invoke({
      question: "What is the price?",
      productId: "product-123",
    });

    expect(getVectorStore).toHaveBeenCalled();

    expect(similaritySearch).toHaveBeenCalledWith(
      "What is the price?",
      4,
      {
        productId: "product-123",
      }
    );

    expect(generateAnswer).toHaveBeenCalledWith(
      expect.stringContaining("Product Name: iPhone 15")
    );

    expect(generateAnswer).toHaveBeenCalledWith(
      expect.stringContaining("What is the price?")
    );

    expect(result.context).toBe(
      "Product Name: iPhone 15\n\n---\n\nPrice: ₹69999"
    );

    expect(result.answer).toBe(
      "The iPhone 15 costs ₹69999."
    );
  });

  test("should trim the generated answer", async () => {
    getVectorStore.mockResolvedValue({
      similaritySearch: jest.fn().mockResolvedValue([
        {
          pageContent: "Test product context",
        },
      ]),
    });

    generateAnswer.mockResolvedValue(
      "   This is the answer.   "
    );

    const result = await graph.invoke({
      question: "Test question",
      productId: "product-123",
    });

    expect(result.answer).toBe("This is the answer.");
  });

  test("should handle empty vector search results", async () => {
    getVectorStore.mockResolvedValue({
      similaritySearch: jest.fn().mockResolvedValue([]),
    });

    generateAnswer.mockResolvedValue(
      "I don't have enough information about that."
    );

    const result = await graph.invoke({
      question: "Unknown question",
      productId: "product-123",
    });

    expect(result.context).toBe("");

    expect(result.answer).toBe(
      "I don't have enough information about that."
    );
  });

  test("should propagate vector store errors", async () => {
    getVectorStore.mockRejectedValue(
      new Error("Vector store unavailable")
    );

    await expect(
      graph.invoke({
        question: "What is the price?",
        productId: "product-123",
      })
    ).rejects.toThrow("Vector store unavailable");

    expect(generateAnswer).not.toHaveBeenCalled();
  });

  test("should propagate answer generation errors", async () => {
    getVectorStore.mockResolvedValue({
      similaritySearch: jest.fn().mockResolvedValue([
        {
          pageContent: "Product context",
        },
      ]),
    });

    generateAnswer.mockRejectedValue(
      new Error("HF generation failed")
    );

    await expect(
      graph.invoke({
        question: "What is the price?",
        productId: "product-123",
      })
    ).rejects.toThrow("HF generation failed");
  });
});