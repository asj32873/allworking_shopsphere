import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "../utils/testUtils";
import OrderDetails from "../../src/pages/OrderDetails";

test("OrderDetails renders an owned order and address", () => {
  renderWithProviders(
    <Routes>
      <Route path="/orders/:id" element={<OrderDetails />} />
    </Routes>,
    {
      route: "/orders/o1",
      preloadedState: {
        auth: { user: { id: "u1" } },
        orders: {
          items: [
            {
              id: "o1",
              userId: "u1",
              status: "DELIVERED",
              paymentStatus: "PAID",
              totalAmount: 300,
              addressId: "a1",
              items: [
                {
                  id: "i1",
                  name: "Phone",
                  quantity: 2,
                  unitPrice: 150,
                  vendorStatus: "DELIVERED",
                },
              ],
            },
          ],
        },
        addresses: {
          items: [
            {
              id: "a1",
              addressLine: "1 Main",
              city: "Pune",
              state: "MH",
              pincode: "411001",
            },
          ],
        },
      },
    },
  );

  expect(
    screen.getByRole("heading", { name: "Order #o1" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Phone")).toBeInTheDocument();
  expect(screen.getAllByText("₹300")).toHaveLength(2);
  expect(screen.getByText("1 Main, Pune, MH - 411001")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Orders/ })).toHaveAttribute(
    "href",
    "/orders",
  );
});

test("OrderDetails rejects an order owned by another user", () => {
  renderWithProviders(
    <Routes>
      <Route path="/orders/:id" element={<OrderDetails />} />
    </Routes>,
    {
      route: "/orders/o1",
      preloadedState: {
        auth: { user: { id: "u2" } },
        orders: { items: [{ id: "o1", userId: "u1" }] },
      },
    },
  );

  expect(screen.getByText("Order not found.")).toBeInTheDocument();
});
