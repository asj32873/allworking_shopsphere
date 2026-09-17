const mockPostJson = jest.fn();

jest.mock("../../src/utils/serviceClient", () => ({
  postJson: mockPostJson,
}));

const { ask } = require("../../src/controllers/qa.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("QA controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.RAG_SERVICE_URL =
      "http://localhost:5010";
  });

  test("sends question to RAG service", async () => {
    const response = {
      success: true,
      data: {
        answer: "This is an answer",
      },
    };

    mockPostJson.mockResolvedValue({
      ok: true,
      status: 200,
      data: response,
    });

    const req = {
      params: {
        id: "product-1",
      },
      body: {
        question: "What is this product?",
      },
    };

    const res = createResponse();

    await ask(req, res);

    expect(mockPostJson).toHaveBeenCalledWith(
      "http://localhost:5010",
      "/internal/products/product-1/qa",
      {
        question: "What is this product?",
      }
    );

    expect(res.json).toHaveBeenCalledWith(response);
  });

  test("returns downstream error", async () => {
    const errorData = {
      success: false,
      message: "RAG unavailable",
    };

    mockPostJson.mockResolvedValue({
      ok: false,
      status: 503,
      data: errorData,
    });

    const req = {
      params: {
        id: "product-1",
      },
      body: {
        question: "Question",
      },
    };

    const res = createResponse();

    await ask(req, res);

    expect(res.status).toHaveBeenCalledWith(503);

    expect(res.json).toHaveBeenCalledWith(
      errorData
    );
  });

  test("uses default RAG URL", async () => {
    delete process.env.RAG_SERVICE_URL;

    mockPostJson.mockResolvedValue({
      ok: true,
      data: {
        answer: "answer",
      },
    });

    const req = {
      params: {
        id: "product-1",
      },
      body: {
        question: "Question",
      },
    };

    const res = createResponse();

    await ask(req, res);

    expect(mockPostJson).toHaveBeenCalledWith(
      "http://localhost:5010",
      "/internal/products/product-1/qa",
      {
        question: "Question",
      }
    );
  });
});