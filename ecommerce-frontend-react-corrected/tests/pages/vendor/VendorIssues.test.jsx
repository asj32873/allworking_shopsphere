import { fireEvent, screen } from "@testing-library/react";
import VendorIssues from "../../../src/pages/vendor/VendorIssues";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("VendorIssues filters related issues and updates status", () => {
  api.patch.mockResolvedValue({});
  renderWithProviders(<VendorIssues />, {
    preloadedState: {
      auth: { user: { id: "v1", role: "VENDOR" } },
      issues: {
        items: [
          {
            id: "i1",
            vendorId: "v1",
            subject: "Late",
            description: "Delayed",
            status: "OPEN",
          },
          {
            id: "i2",
            subject: "Other",
            description: "Hidden",
            status: "OPEN",
            orderId: "o1",
          },
        ],
      },
      orders: { items: [{ id: "o1", items: [{ vendorId: "v2" }] }] },
    },
  });
  expect(screen.getByText("#i1 — Late")).toBeInTheDocument();
  expect(screen.queryByText("#i2 — Other")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "In Progress" }));
  fireEvent.click(screen.getByRole("button", { name: "Resolve" }));
  expect(api.patch).toHaveBeenNthCalledWith(1, "/issues/i1", {
    data: { status: "IN_PROGRESS" },
  });
  expect(api.patch).toHaveBeenNthCalledWith(2, "/issues/i1", {
    data: { status: "RESOLVED", response: "Resolved by vendor." },
  });
});
