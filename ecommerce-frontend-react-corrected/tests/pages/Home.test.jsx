import React from "react";
import { screen } from "@testing-library/react";
import Home from "../../src/pages/Home";
import { renderWithProviders } from "../utils/testUtils";

describe("Home page", () => {
  test("renders hero banner and shop products button", () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        products: { items: [] },
      },
    });

    expect(
      screen.getByText("Everything you need, from trusted vendors."),
    ).toBeInTheDocument();
    expect(screen.getByText("Shop Products")).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.getByText("Popular Products")).toBeInTheDocument();
  });

  test("renders popular products from Redux store", () => {
    const mockProducts = [
      {
        id: "p1",
        name: "Wireless Earbuds",
        brand: "SoundCo",
        category: "Audio",
        price: 2999,
        stock: 10,
      },
      {
        id: "p2",
        name: "Smart Watch",
        brand: "FitTech",
        category: "Wearables",
        price: 4999,
        stock: 5,
      },
    ];

    renderWithProviders(<Home />, {
      preloadedState: {
        products: { items: mockProducts },
      },
    });

    expect(screen.getByText("Wireless Earbuds")).toBeInTheDocument();
    expect(screen.getByText("Smart Watch")).toBeInTheDocument();
  });
});
