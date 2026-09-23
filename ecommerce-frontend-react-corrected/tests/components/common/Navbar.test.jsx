import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import Navbar from "../../../src/components/common/Navbar";
import { renderWithProviders } from "../../utils/testUtils";

describe("Navbar component", () => {
  test("renders guest navigation items when not logged in", () => {
    renderWithProviders(<Navbar />, {
      preloadedState: {
        auth: { user: null },
        cart: { items: [] },
      },
    });

    expect(screen.getByText("ShopSphere")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Become a Vendor")).toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders user-specific links and cart count for USER role", () => {
    renderWithProviders(<Navbar />, {
      preloadedState: {
        auth: { user: { role: "USER", name: "Alice" } },
        cart: { items: [{ id: "c1" }, { id: "c2" }] },
      },
    });

    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Cart (2)")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("renders vendor link for VENDOR role", () => {
    renderWithProviders(<Navbar />, {
      preloadedState: {
        auth: { user: { role: "VENDOR", name: "VendorBob" } },
        cart: { items: [] },
      },
    });

    expect(screen.getByText("Vendor")).toBeInTheDocument();
    expect(screen.queryByText("Orders")).not.toBeInTheDocument();
    expect(screen.queryByText(/Cart/)).not.toBeInTheDocument();
    expect(screen.getByText("VendorBob")).toBeInTheDocument();
  });

  test("renders admin link for ADMIN role", () => {
    renderWithProviders(<Navbar />, {
      preloadedState: {
        auth: { user: { role: "ADMIN", name: "SuperAdmin" } },
        cart: { items: [] },
      },
    });

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("SuperAdmin")).toBeInTheDocument();
  });

  test("clicking logout clears session and dispatches actions", () => {
    const { store } = renderWithProviders(<Navbar />, {
      preloadedState: {
        auth: { user: { role: "USER", name: "Alice" } },
        cart: { items: [{ id: "c1" }] },
      },
    });

    fireEvent.click(screen.getByText("Logout"));

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().cart.items).toEqual([]);
  });
});
