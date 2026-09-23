import { fireEvent, screen } from "@testing-library/react";

import AdminIssues from "../../../src/pages/admin/AdminIssues";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("AdminIssues renders issues and dispatches assignment and status changes", () => {
  api.patch.mockResolvedValue({ _id: "i1" });

  renderWithProviders(<AdminIssues />, {
    preloadedState: {
      issues: {
        items: [
          {
            id: "i1",
            subject: "Late",
            description: "Delayed",
            priority: "HIGH",
            orderId: "o1",
            status: "OPEN",
          },
        ],
      },
      vendors: {
        items: [
          {
            id: "v1",
            userId: "u-v1",
            storeName: "Fast Store",
            status: "VERIFIED",
          },
          { id: "v2", storeName: "Hidden", status: "APPLIED" },
        ],
      },
    },
  });

  expect(screen.getByText("#i1 — Late")).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "Fast Store" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Hidden" }),
  ).not.toBeInTheDocument();

  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[0], { target: { value: "u-v1" } });
  fireEvent.change(selects[1], { target: { value: "RESOLVED" } });

  expect(api.patch).toHaveBeenNthCalledWith(1, "/issues/i1", {
    data: { assignedTo: "u-v1" },
  });
  expect(api.patch).toHaveBeenNthCalledWith(2, "/issues/i1", {
    data: { status: "RESOLVED" },
  });
});
