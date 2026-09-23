import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../../src/pages/Register";
import { renderWithProviders } from "../utils/testUtils";
import { registerUser } from "../../src/store/slices/authSlice";

jest.mock("../../src/store/slices/authSlice", () => {
  const actual = jest.requireActual("../../src/store/slices/authSlice");
  return {
    ...actual,
    registerUser: jest.fn(),
  };
});

describe("Register page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders registration form fields", () => {
    renderWithProviders(<Register />);

    expect(
      screen.getByRole("heading", { name: "Create Account" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Account" }),
    ).toBeInTheDocument();
  });

  test("submits valid registration form data", async () => {
    registerUser.mockReturnValue(() => ({
      unwrap: jest.fn().mockResolvedValue(true),
    }));

    renderWithProviders(<Register />);

    const textInputs = screen.getAllByRole("textbox");
    const passwordInput = document.querySelector('input[type="password"]');

    fireEvent.change(textInputs[0], {
      target: { value: "Bob Smith" },
    });
    fireEvent.change(textInputs[1], {
      target: { value: "bob@test.com" },
    });
    fireEvent.change(textInputs[2], {
      target: { value: "9876543210" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "pass1234" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: "Bob Smith",
        email: "bob@test.com",
        phone: "9876543210",
        password: "pass1234",
      });
    });
  });

  test("renders error message on registration failure", async () => {
    registerUser.mockReturnValue(() => ({
      unwrap: jest.fn().mockRejectedValue("Email already exists"),
    }));

    renderWithProviders(<Register />);

    const textInputs = screen.getAllByRole("textbox");
    const passwordInput = document.querySelector('input[type="password"]');

    fireEvent.change(textInputs[0], {
      target: { value: "Bob" },
    });
    fireEvent.change(textInputs[1], {
      target: { value: "existing@test.com" },
    });
    fireEvent.change(textInputs[2], {
      target: { value: "9876543210" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "pass1234" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
  });
});
