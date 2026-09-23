import React from "react";
import { screen } from "@testing-library/react";
import App from "../src/App";
import { renderWithProviders } from "./utils/testUtils";

jest.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    loginWithRedirect: jest.fn(),
    isLoading: false,
  }),
}));

describe("App root routing", () => {
  const baseState = {
    auth: { user: null, loading: false, initialized: true },
    products: { items: [] },
    cart: { items: [], total: 0 },
    orders: { items: [] },
    addresses: { items: [] },
  };

  test("renders Home page on root route /", () => {
    renderWithProviders(<App />, {
      preloadedState: baseState,
      route: "/",
    });

    expect(
      screen.getByText("Everything you need, from trusted vendors."),
    ).toBeInTheDocument();
  });

  test("renders Login page on /login", () => {
    renderWithProviders(<App />, {
      preloadedState: baseState,
      route: "/login",
    });

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  test("renders Register page on /register", () => {
    renderWithProviders(<App />, {
      preloadedState: baseState,
      route: "/register",
    });

    expect(
      screen.getByRole("heading", { name: "Create Account" }),
    ).toBeInTheDocument();
  });

  test("renders Products catalog on /products", () => {
    renderWithProviders(<App />, {
      preloadedState: baseState,
      route: "/products",
    });

    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  test("redirects unauthenticated user from protected /cart route to /login", () => {
    renderWithProviders(<App />, {
      preloadedState: {
        ...baseState,
        auth: { user: null, loading: false },
      },
      route: "/cart",
    });

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  test("allows authenticated USER to access /cart", () => {
    renderWithProviders(<App />, {
      preloadedState: {
        ...baseState,
        auth: { user: { role: "USER" }, loading: false },
      },
      route: "/cart",
    });

    expect(screen.getByText("Cart is empty")).toBeInTheDocument();
  });

  test("redirects unknown route to home via catch-all", () => {
    renderWithProviders(<App />, {
      preloadedState: baseState,
      route: "/unknown-page-path-12345",
    });

    expect(
      screen.getByText("Everything you need, from trusted vendors."),
    ).toBeInTheDocument();
  });
});
