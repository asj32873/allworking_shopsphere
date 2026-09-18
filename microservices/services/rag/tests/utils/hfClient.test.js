const mockChatCompletion = jest.fn();

jest.mock("@huggingface/inference", () => ({
  HfInference: jest.fn().mockImplementation(() => ({
    chatCompletion: mockChatCompletion,
  })),
}));

describe("hfClient", () => {
  let generateAnswer;

  beforeEach(() => {
    jest.resetModules();

    mockChatCompletion.mockReset();

    process.env.HF_TOKEN = "test-token";
    process.env.HF_MODEL = "test-model";

    ({ generateAnswer } = require("../../src/utils/hfClient"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("generates an answer using HuggingFace chat completion", async () => {
    mockChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: "The product costs ₹999.",
          },
        },
      ],
    });

    const result = await generateAnswer("What is the price?");

    expect(result).toBe("The product costs ₹999.");

    expect(mockChatCompletion).toHaveBeenCalledWith({
      model: "test-model",
      messages: [
        {
          role: "user",
          content: "What is the price?",
        },
      ],
      max_tokens: 300,
      temperature: 0.2,
    });
  });

  test("passes the complete prompt to HuggingFace", async () => {
    mockChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Available in black.",
          },
        },
      ],
    });

    const prompt =
      "Answer using only the product context.\nProduct: Phone";

    const result = await generateAnswer(prompt);

    expect(result).toBe("Available in black.");

    expect(mockChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      })
    );
  });

  test("propagates HuggingFace API errors", async () => {
    mockChatCompletion.mockRejectedValue(
      new Error("HuggingFace service unavailable")
    );

    await expect(
      generateAnswer("Test question")
    ).rejects.toThrow("HuggingFace service unavailable");

    expect(mockChatCompletion).toHaveBeenCalledTimes(1);
  });

  test("returns content from the first choice", async () => {
    mockChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: "First answer",
          },
        },
        {
          message: {
            content: "Second answer",
          },
        },
      ],
    });

    const result = await generateAnswer("Question");

    expect(result).toBe("First answer");
  });
});