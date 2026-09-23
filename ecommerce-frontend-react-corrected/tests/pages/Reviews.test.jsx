import { screen } from "@testing-library/react";

import Reviews from "../../src/pages/Reviews";
import { renderWithProviders } from "../utils/testUtils";

describe("Reviews", () => {
  test("renders only the current user's reviews with product links", () => {
    renderWithProviders(<Reviews />, {
      preloadedState: {
        auth: { user: { id: "u1" } },
        reviews: {
          items: [
            {
              id: "r1",
              userId: "u1",
              productId: "p1",
              rating: 4,
              review: "Great",
              createdAt: "2026-01-01",
            },
            {
              id: "r2",
              userId: "u2",
              productId: "p2",
              rating: 5,
              review: "Hidden",
              createdAt: "2026-01-02",
            },
          ],
        },
        products: { items: [{ id: "p1", name: "Phone" }] },
      },
    });

    expect(
      screen.getByRole("heading", { name: "My Reviews" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phone" })).toHaveAttribute(
      "href",
      "/products/p1",
    );
    expect(screen.getByText("★★★★")).toBeInTheDocument();
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});
