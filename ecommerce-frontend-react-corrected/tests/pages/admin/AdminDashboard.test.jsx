import { screen } from "@testing-library/react";

import AdminDashboard from "../../../src/pages/admin/AdminDashboard";
import { renderWithProviders } from "../../utils/testUtils";

test("AdminDashboard renders aggregate counts", () => {
  renderWithProviders(<AdminDashboard />, {
    preloadedState: {
      users: { items: [{ id: "u1" }, { id: "u2" }] },
      vendors: {
        items: [
          { id: "v1", status: "APPLIED" },
          { id: "v2", status: "VERIFIED" },
        ],
      },
      products: { items: [{ id: "p1" }] },
      orders: { items: [{ id: "o1" }, { id: "o2" }, { id: "o3" }] },
      issues: {
        items: [
          { id: "i1", status: "OPEN" },
          { id: "i2", status: "RESOLVED" },
        ],
      },
    },
  });

  expect(
    screen.getByRole("heading", { name: "Admin Dashboard" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Pending Vendors").nextElementSibling,
  ).toHaveTextContent("1");
  expect(screen.getByText("Open Issues").nextElementSibling).toHaveTextContent(
    "1",
  );
  expect(screen.getAllByText("Orders")[1].nextElementSibling).toHaveTextContent(
    "3",
  );
});
