import React from "react";
import { screen } from "@testing-library/react";
import Orders from "../../src/pages/Orders";
import { renderWithProviders } from "../utils/testUtils";

describe("Orders page", () => {
  test("renders empty orders alert when user has no orders", () => {
    renderWithProviders(<Orders />, {
      preloadedState: {
        auth: { user: { id: "u-1" } },
        orders: { items: [] },
      },
    });

    expect(
      screen.getByRole("heading", { name: "My Orders" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No orders found.")).toBeInTheDocument();
  });

  test("renders order cards for matching user ID", () => {
    const mockOrders = [
      {
        id: "ord-100",
        userId: "u-1",
        status: "DELIVERED",
        totalAmount: 2500,
      },
      {
        id: "ord-999",
        userId: "u-other",
        status: "PLACED",
        totalAmount: 5000,
      },
    ];

    renderWithProviders(<Orders />, {
      preloadedState: {
        auth: { user: { id: "u-1" } },
        orders: { items: mockOrders },
      },
    });

    expect(screen.getByText("Order #ord-100")).toBeInTheDocument();
    expect(screen.getByText("DELIVERED")).toBeInTheDocument();
    expect(screen.getByText(/₹2,500/)).toBeInTheDocument();
    expect(screen.getByText("Track Order")).toHaveAttribute(
      "href",
      "/orders/ord-100",
    );

    // Other user's order should not be rendered
    expect(screen.queryByText("Order #ord-999")).not.toBeInTheDocument();
  });
});
