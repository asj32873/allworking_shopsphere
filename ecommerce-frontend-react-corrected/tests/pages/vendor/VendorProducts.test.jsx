import { fireEvent, screen } from "@testing-library/react";
import VendorProducts from "../../../src/pages/vendor/VendorProducts";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("VendorProducts filters products, links edit, and deletes", () => {
  api.delete.mockResolvedValue({});
  renderWithProviders(<VendorProducts />, {
    preloadedState: {
      auth: { user: { id: "v1", role: "VENDOR" } },
      products: {
        items: [
          { id: "p1", vendorId: "v1", name: "Phone", price: 1234, stock: 4 },
          { id: "p2", vendorId: "v2", name: "Hidden", price: 10, stock: 1 },
        ],
      },
    },
  });
  expect(screen.getByText("Phone")).toBeInTheDocument();
  expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Add Product" })).toHaveAttribute(
    "href",
    "/vendor/products/create",
  );
  expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
    "href",
    "/vendor/products/p1/edit",
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(api.delete).toHaveBeenCalledWith("/products/p1");
});
