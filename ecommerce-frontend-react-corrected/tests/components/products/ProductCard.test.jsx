import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import ProductCard from "../../../src/components/products/ProductCard";
import { renderWithProviders } from "../../utils/testUtils";
import { addToCart } from "../../../src/store/slices/cartSlice";

jest.mock("../../../src/store/slices/cartSlice", () => {
  const actual = jest.requireActual("../../../src/store/slices/cartSlice");
  return {
    ...actual,
    addToCart: jest.fn(() => () => ({
      unwrap: jest.fn().mockResolvedValue(true),
    })),
  };
});

describe("ProductCard component", () => {
  const sampleProduct = {
    id: "p100",
    name: "Wireless Headphones",
    brand: "Sony",
    category: "Electronics",
    description: "Noise cancelling wireless over-ear headphones",
    price: 19999,
    rating: 4.8,
    reviewCount: 42,
    stock: 15,
    image: "https://example.com/headphones.jpg",
  };

  test("renders product information correctly", () => {
    renderWithProviders(<ProductCard product={sampleProduct} />);

    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText(/Sony/)).toBeInTheDocument();
    expect(screen.getByText(/Electronics/)).toBeInTheDocument();
    expect(screen.getByText("Noise cancelling wireless over-ear headphones")).toBeInTheDocument();
    expect(screen.getByText("★ 4.8")).toBeInTheDocument();
    expect(screen.getByText("42 reviews")).toBeInTheDocument();
    expect(screen.getByText("In stock (15)")).toBeInTheDocument();
    expect(screen.getByText("View")).toHaveAttribute("href", "/products/p100");
  });

  test("renders placeholder when image is missing", () => {
    const noImageProduct = { ...sampleProduct, image: "" };
    renderWithProviders(<ProductCard product={noImageProduct} />);

    expect(screen.getByText("No image available")).toBeInTheDocument();
  });

  test("renders Out of stock when stock is 0", () => {
    const outOfStockProduct = { ...sampleProduct, stock: 0 };
    renderWithProviders(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  test("renders Add button only for USER role and handles click", async () => {
    renderWithProviders(<ProductCard product={sampleProduct} />, {
      preloadedState: {
        auth: { user: { role: "USER" } },
      },
    });

    const addBtn = screen.getByRole("button", { name: "Add" });
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).not.toBeDisabled();

    fireEvent.click(addBtn);

    expect(addToCart).toHaveBeenCalledWith({
      product: sampleProduct,
      quantity: 1,
    });
  });

  test("does not render Add button for unauthenticated users", () => {
    renderWithProviders(<ProductCard product={sampleProduct} />, {
      preloadedState: {
        auth: { user: null },
      },
    });

    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });
});
