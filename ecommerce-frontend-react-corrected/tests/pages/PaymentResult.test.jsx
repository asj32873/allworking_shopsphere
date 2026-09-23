import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import PaymentSuccess from "../../src/pages/PaymentSuccess";
import PaymentCancel from "../../src/pages/PaymentCancel";

describe("payment result pages", () => {
  test("renders success message and orders link", () => {
    render(
      <MemoryRouter>
        <PaymentSuccess />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Payment Successful" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/test payment was successful/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View My Orders" }),
    ).toHaveAttribute("href", "/orders");
  });

  test("renders cancelled message and cart link", () => {
    render(
      <MemoryRouter>
        <PaymentCancel />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Payment Cancelled" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no order was created/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to Cart" }),
    ).toHaveAttribute("href", "/cart");
  });
});
