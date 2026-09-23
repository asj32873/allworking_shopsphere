import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import ProductDetails from "../../src/pages/ProductDetails";
import { addToCart } from "../../src/store/slices/cartSlice";
import { renderWithProviders } from "../utils/testUtils";

jest.mock("../../src/store/slices/cartSlice", () => {
  const actual = jest.requireActual("../../src/store/slices/cartSlice");
  return {
    ...actual,
    addToCart: jest.fn((payload) => ({ type: "cart/add", payload })),
  };
});

jest.mock("../../src/components/products/ProductQA", () => () => (
  <div>Product Q&amp;A</div>
));
jest.mock(
  "../../src/components/products/ReviewForm",
  () =>
    ({ existingReview }) => (
      <div>{existingReview ? "Edit Review" : "Write Review"}</div>
    ),
);

describe("ProductDetails", () => {
  test("renders product details and adds the selected quantity to cart", () => {
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>,
      {
        route: "/products/p1",
        preloadedState: {
          auth: { user: { id: "u1", role: "USER" } },
          products: {
            items: [
              {
                id: "p1",
                name: "Phone",
                brand: "Acme",
                category: "Tech",
                image: "phone.jpg",
                price: 1234,
                stock: 5,
                rating: 4.5,
                reviewCount: 1,
                description: "Useful",
                vendor: { storeName: "Asha Store" },
              },
            ],
          },
          reviews: {
            items: [
              {
                id: "r1",
                productId: "p1",
                userId: "u2",
                rating: 4,
                review: "Great",
                createdAt: "2026-01-01",
              },
            ],
          },
          orders: { items: [] },
        },
      },
    );

    expect(screen.getByRole("heading", { name: "Phone" })).toBeInTheDocument();
    expect(screen.getByText("Asha Store")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You can review this product after purchasing it and receiving a delivered order.",
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(addToCart).toHaveBeenCalledWith({ productId: "p1", quantity: 3 });
  });

  test("shows review form for a delivered purchaser", () => {
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>,
      {
        route: "/products/p1",
        preloadedState: {
          auth: { user: { id: "u1", role: "USER" } },
          products: {
            items: [
              {
                id: "p1",
                name: "Phone",
                price: 10,
                stock: 1,
                rating: 0,
                reviewCount: 0,
                description: "Useful",
              },
            ],
          },
          reviews: { items: [] },
          orders: {
            items: [
              {
                userId: "u1",
                status: "DELIVERED",
                items: [{ productId: "p1" }],
              },
            ],
          },
        },
      },
    );

    expect(screen.getByText("Write Review")).toBeInTheDocument();
  });

  test("renders missing product state", () => {
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>,
      { route: "/products/missing" },
    );
    expect(screen.getByText("Product not found.")).toBeInTheDocument();
  });
});
