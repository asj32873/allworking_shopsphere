import { fireEvent, screen } from "@testing-library/react";
import AdminReviews from "../../../src/pages/admin/AdminReviews";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("AdminReviews renders product details and deletes a review", () => {
  api.delete.mockResolvedValue({});
  renderWithProviders(<AdminReviews />, {
    preloadedState: {
      products: { items: [{ id: "p1", name: "Phone" }] },
      reviews: {
        items: [
          { id: "r1", productId: "p1", rating: 4, review: "Great" },
          { id: "r2", productId: "missing", rating: 2, review: "Poor" },
        ],
      },
    },
  });
  expect(screen.getByText("Phone")).toBeInTheDocument();
  expect(screen.getByText("Unknown Product")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
  expect(api.delete).toHaveBeenCalledWith("/reviews/r1");
});
