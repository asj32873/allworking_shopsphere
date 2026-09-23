import { fireEvent, screen } from "@testing-library/react";
import AdminOrders from "../../../src/pages/admin/AdminOrders";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("AdminOrders renders items and updates status", () => {
  api.patch.mockResolvedValue({});
  renderWithProviders(<AdminOrders />, {
    preloadedState: {
      orders: {
        items: [
          {
            id: "o1",
            items: [
              { id: "i1", name: "Phone", quantity: 2, vendorStatus: "PLACED" },
            ],
          },
        ],
      },
    },
  });
  expect(screen.getByText("Order #o1")).toBeInTheDocument();
  expect(screen.getByText("Phone × 2")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "CONFIRMED" },
  });
  expect(api.patch).toHaveBeenCalledWith("/orders/admin/o1/items/i1/status", {
    status: "CONFIRMED",
  });
});
