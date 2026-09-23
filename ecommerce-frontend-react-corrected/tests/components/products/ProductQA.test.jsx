import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProductQA from "../../../src/components/products/ProductQA";

describe("ProductQA component", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("renders question input and button", () => {
    render(<ProductQA productId="prod-1" />);

    expect(
      screen.getByPlaceholderText(/Ask something about this product/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask AI" })).toBeInTheDocument();
  });

  test("validates empty question", async () => {
    render(<ProductQA productId="prod-1" />);

    fireEvent.keyDown(
      screen.getByPlaceholderText(/Ask something about this product/i),
      { key: "Enter", code: "Enter" },
    );

    expect(
      await screen.findByText("Please enter a question."),
    ).toBeInTheDocument();
  });

  test("submits question and renders received answer", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { answer: "This product supports fast charging up to 65W." },
      }),
    });

    render(<ProductQA productId="prod-1" />);

    const input = screen.getByPlaceholderText(
      /Ask something about this product/i,
    );
    fireEvent.change(input, {
      target: { value: "Does it support fast charging?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));

    await waitFor(() => {
      expect(
        screen.getByText("This product supports fast charging up to 65W."),
      ).toBeInTheDocument();
    });
  });
});
