import { fireEvent, screen, waitFor } from "@testing-library/react";

import Issues from "../../src/pages/Issues";
import { api } from "../../src/api/client";
import { renderWithProviders } from "../utils/testUtils";

jest.mock("../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("Issues", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({ _id: "i3", userId: "u1" });
  });

  const state = {
    auth: { user: { id: "u1", role: "USER" } },
    orders: {
      items: [
        { id: "o1", userId: "u1" },
        { id: "o2", userId: "u2" },
      ],
    },
    issues: {
      items: [
        {
          id: "i1",
          userId: "u1",
          subject: "Late",
          description: "Delayed",
          status: "OPEN",
          response: "Checking",
        },
        {
          id: "i2",
          userId: "u2",
          subject: "Other",
          description: "Hidden",
          status: "CLOSED",
        },
      ],
    },
  };

  test("shows the user's orders and issues only", () => {
    renderWithProviders(<Issues />, { preloadedState: state });

    expect(
      screen.getByRole("heading", { name: "Customer Issues" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "#o1" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "#o2" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("#i1 — Late")).toBeInTheDocument();
    expect(screen.getByText("Checking")).toBeInTheDocument();
    expect(screen.queryByText("#i2 — Other")).not.toBeInTheDocument();
  });

  test("does not submit an incomplete issue", () => {
    renderWithProviders(<Issues />, { preloadedState: state });

    fireEvent.click(screen.getByRole("button", { name: "Submit Issue" }));

    expect(api.post).not.toHaveBeenCalled();
  });

  test("submits a complete issue and clears the form", async () => {
    renderWithProviders(<Issues />, { preloadedState: state });

    fireEvent.change(screen.getByPlaceholderText("Subject"), {
      target: { value: "Missing item" },
    });
    fireEvent.change(screen.getByPlaceholderText("Description"), {
      target: { value: "One item was missing" },
    });
    fireEvent.change(screen.getByDisplayValue("No specific order"), {
      target: { value: "o1" },
    });
    fireEvent.change(screen.getByDisplayValue("MEDIUM"), {
      target: { value: "HIGH" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Issue" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/issues", {
        subject: "Missing item",
        description: "One item was missing",
        orderId: "o1",
        priority: "HIGH",
      });
      expect(screen.getByPlaceholderText("Subject")).toHaveValue("");
      expect(screen.getByPlaceholderText("Description")).toHaveValue("");
    });
  });
});
