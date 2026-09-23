import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import VendorProductEdit from "../../../src/pages/vendor/VendorProductEdit";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("VendorProductEdit", () => {
  test("updates an existing vendor product", async () => {
    api.put.mockResolvedValue({ id: "p1" });
    renderWithProviders(
      <Routes>
        <Route
          path="/vendor/products/:productId/edit"
          element={<VendorProductEdit />}
        />
      </Routes>,
      {
        route: "/vendor/products/p1/edit",
        preloadedState: {
          auth: { user: { id: "v1" } },
          products: {
            items: [
              {
                id: "p1",
                vendorId: "v1",
                name: "Phone",
                brand: "Acme",
                category: "MOBILE",
                price: 10,
                stock: 2,
                description: "Old",
                image: "",
              },
            ],
          },
        },
      },
    );
    expect(
      screen.getByRole("heading", { name: "Edit Product" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("price"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByPlaceholderText("description"), {
      target: { value: "New" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Product" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        "/products/p1",
        expect.objectContaining({
          price: 20,
          description: "New",
          imageUrl: "",
        }),
      ),
    );
  });
});
