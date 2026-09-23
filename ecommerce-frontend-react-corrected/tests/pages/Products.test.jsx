import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import Products from "../../src/pages/Products";
import { renderWithProviders } from "../utils/testUtils";

describe("Products page", () => {
  const mockProducts = [
    {
      id: "p1",
      name: "Wireless Mouse",
      brand: "Logitech",
      category: "Accessories",
      description: "Ergonomic wireless mouse",
      price: 1500,
      stock: 20,
      rating: 4.5,
    },
    {
      id: "p2",
      name: "Mechanical Keyboard",
      brand: "Keychron",
      category: "Accessories",
      description: "RGB mechanical keyboard",
      price: 6500,
      stock: 5,
      rating: 4.9,
    },
  ];

  test("renders search filter and product list", () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: { items: mockProducts },
      },
    });

    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
  });

  test("filters products based on search input", () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: { items: mockProducts },
      },
    });

    const searchInput = screen.getByPlaceholderText("Search");
    fireEvent.change(searchInput, { target: { value: "Mouse" } });

    expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
    expect(screen.queryByText("Mechanical Keyboard")).not.toBeInTheDocument();
  });

  test("displays no products message when filter yields no matches", () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: { items: mockProducts },
      },
    });

    const searchInput = screen.getByPlaceholderText("Search");
    fireEvent.change(searchInput, { target: { value: "NonExistentItemXYZ" } });

    expect(
      screen.getByText("No products match your filters."),
    ).toBeInTheDocument();
  });
});
