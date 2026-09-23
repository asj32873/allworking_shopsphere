import React from "react";
import { render, screen } from "@testing-library/react";
import OrderTracking from "../../../src/components/orders/OrderTracking";

describe("OrderTracking component", () => {
  test("renders empty state when order has no tracking events", () => {
    render(<OrderTracking order={{ items: [] }} />);

    expect(screen.getByText("No tracking updates yet.")).toBeInTheDocument();
  });

  test("renders tracking events timeline with labels and remarks", () => {
    const order = {
      items: [
        {
          tracking: [
            {
              status: "PLACED",
              date: "2026-03-01T10:00:00Z",
              remarks: "Order received",
            },
            {
              status: "DISPATCHED",
              date: "2026-03-02T14:00:00Z",
              remarks: "Courier picked up parcel",
            },
          ],
        },
      ],
    };

    render(<OrderTracking order={order} />);

    expect(screen.getByText("Order Placed")).toBeInTheDocument();
    expect(screen.getByText("Order received")).toBeInTheDocument();
    expect(screen.getByText("Dispatched")).toBeInTheDocument();
    expect(screen.getByText("Courier picked up parcel")).toBeInTheDocument();
  });
});
