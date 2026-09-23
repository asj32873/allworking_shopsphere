import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../../src/pages/Login";
import { renderWithProviders } from "../utils/testUtils";
import { login } from "../../src/store/slices/authSlice";

const mockLoginWithRedirect = jest.fn();

jest.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    loginWithRedirect: mockLoginWithRedirect,
    isLoading: false,
  }),
}));

jest.mock("../../src/store/slices/authSlice", () => {
  const actual = jest.requireActual("../../src/store/slices/authSlice");
  return {
    ...actual,
    login: jest.fn(),
  };
});

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders login form with inputs and action buttons", () => {
    renderWithProviders(<Login />);

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    expect(
      document.querySelector('input[type="password"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue with Google/i }),
    ).toBeInTheDocument();
  });

  test("submits form with entered email and password", async () => {
    login.mockReturnValue(() => ({
      unwrap: jest.fn().mockResolvedValue({
        user: { role: "USER" },
      }),
    }));

    renderWithProviders(<Login />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "user@test.com",
        password: "secret123",
      });
    });
  });

  test("displays error message when login fails", async () => {
    login.mockReturnValue(() => ({
      unwrap: jest.fn().mockRejectedValue("Invalid credentials provided."),
    }));

    renderWithProviders(<Login />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "wrong@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Invalid credentials provided."),
    ).toBeInTheDocument();
  });

  test("calls Auth0 loginWithRedirect when clicking Auth0 button", () => {
    renderWithProviders(<Login />);

    fireEvent.click(
      screen.getByRole("button", { name: /Continue with Google/i }),
    );

    expect(mockLoginWithRedirect).toHaveBeenCalled();
  });
});
