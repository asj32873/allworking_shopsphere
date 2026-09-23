import { fireEvent, screen } from "@testing-library/react";
import VendorOrders from "../../../src/pages/vendor/VendorOrders";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("VendorOrders shows only vendor items and advances status", () => {
  api.patch.mockResolvedValue({});
  renderWithProviders(<VendorOrders />, {
    preloadedState: {
      auth: { user: { id: "v1", role: "VENDOR" } },
      orders: {
        items: [
          {
            id: "o1",
            items: [
              {
                id: "i1",
                vendorId: "v1",
                name: "Phone",
                quantity: 1,
                vendorStatus: "PLACED",
              },
              {
                id: "i2",
                vendorId: "v2",
                name: "Hidden",
                quantity: 4,
                vendorStatus: "PLACED",
              },
            ],
          },
        ],
      },
    },
  });
  expect(screen.getByText("Phone")).toBeInTheDocument();
  expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "CONFIRMED" },
  });
  expect(api.patch).toHaveBeenCalledWith("/orders/vendor/o1/items/i1/status", {
    status: "CONFIRMED",
  });
});
