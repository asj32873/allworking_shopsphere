import { screen } from "@testing-library/react";

import VendorDashboard from "../../../src/pages/vendor/VendorDashboard";
import { renderWithProviders } from "../../utils/testUtils";

test("VendorDashboard renders vendor-scoped metrics", () => {
  renderWithProviders(<VendorDashboard />, {
    preloadedState: {
      auth: { user: { id: "u-v1", role: "VENDOR" } },
      products: {
        items: [
          { id: "p1", vendorId: "u-v1", stock: 4 },
          { id: "p2", vendorId: "u-v1", stock: 20 },
          { id: "p3", vendorId: "u2", stock: 1 },
        ],
      },
      orders: {
        items: [
          {
            id: "o1",
            items: [{ vendorId: "u-v1", quantity: 2, unitPrice: 150 }],
          },
          {
            id: "o2",
            items: [{ vendorId: "u2", quantity: 1, unitPrice: 999 }],
          },
        ],
      },
      issues: {
        items: [
          { id: "i1", vendorId: "u-v1", status: "OPEN" },
          { id: "i2", vendorId: "u-v1", status: "RESOLVED" },
        ],
      },
    },
  });

  expect(
    screen.getByRole("heading", { name: "Vendor Dashboard" }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText("Products")[1].nextElementSibling,
  ).toHaveTextContent("2");
  expect(screen.getAllByText("Orders")[1].nextElementSibling).toHaveTextContent(
    "1",
  );
  expect(screen.getByText("Low Stock").nextElementSibling).toHaveTextContent(
    "1",
  );
  expect(screen.getByText("Open Issues").nextElementSibling).toHaveTextContent(
    "1",
  );
  expect(screen.getByText("Sales").nextElementSibling).toHaveTextContent(
    "₹300",
  );
});
