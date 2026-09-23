import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import Cart from "../../src/pages/Cart";
import { renderWithProviders } from "../utils/testUtils";
import {
  updateCartQty,
  removeFromCart,
} from "../../src/store/slices/cartSlice";

jest.mock("../../src/store/slices/cartSlice", () => {
  const actual = jest.requireActual("../../src/store/slices/cartSlice");
  return {
    ...actual,
    __esModule: true,
    default: actual.default || actual,
    loadCart: jest.fn(() => () => ({ unwrap: jest.fn() })),
    updateCartQty: jest.fn(() => () => ({ unwrap: jest.fn() })),
    removeFromCart: jest.fn(() => () => ({ unwrap: jest.fn() })),
  };
});

jest.mock("../../src/store/slices/addressSlice", () => {
  const actual = jest.requireActual("../../src/store/slices/addressSlice");
  return {
    ...actual,
    __esModule: true,
    default: actual.default || actual,
    loadAddresses: jest.fn(() => () => ({ unwrap: jest.fn() })),
  };
});

describe("Cart page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders empty cart message when no items", () => {
    renderWithProviders(<Cart />, {
      preloadedState: {
        cart: { items: [], total: 0 },
        addresses: { items: [] },
      },
    });

    expect(screen.getByText("Cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Browse Products")).toHaveAttribute(
      "href",
      "/products",
    );
  });

  test("renders cart items, total and handles quantity change", () => {
    const mockItems = [
      {
        id: "c1",
        productId: "p1",
        quantity: 2,
        price: 1500,
        product: {
          id: "p1",
          name: "Running Shoes",
          price: 1500,
          stock: 10,
        },
      },
    ];

    renderWithProviders(<Cart />, {
      preloadedState: {
        cart: { items: mockItems, total: 3000 },
        addresses: {
          items: [{ id: "addr-1", street: "123 Main St", isDefault: true }],
        },
      },
    });

    expect(screen.getByText("Running Shoes")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Checkout" }),
    ).toBeInTheDocument();

    const increaseBtn = screen.getByText("+");
    fireEvent.click(increaseBtn);

    expect(updateCartQty).toHaveBeenCalledWith({
      productId: "p1",
      quantity: 3,
    });
  });

  test("handles item removal from cart", () => {
    const mockItems = [
      {
        id: "c1",
        productId: "p1",
        quantity: 1,
        price: 500,
        product: {
          id: "p1",
          name: "Coffee Mug",
          price: 500,
        },
      },
    ];

    renderWithProviders(<Cart />, {
      preloadedState: {
        cart: { items: mockItems, total: 500 },
        addresses: { items: [] },
      },
    });

    const removeBtn = screen.getByRole("button", { name: /Remove/i });
    fireEvent.click(removeBtn);

    expect(removeFromCart).toHaveBeenCalledWith("p1");
  });
});
