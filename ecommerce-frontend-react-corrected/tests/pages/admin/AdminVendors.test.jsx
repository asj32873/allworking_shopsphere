import { fireEvent, screen } from "@testing-library/react";

import AdminVendors from "../../../src/pages/admin/AdminVendors";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("AdminVendors renders status actions and dispatches vendor operations", () => {
  api.patch.mockResolvedValue({ id: "v1" });
  api.delete.mockResolvedValue({});

  renderWithProviders(<AdminVendors />, {
    preloadedState: {
      vendors: {
        items: [
          {
            id: "v1",
            storeName: "Applied Store",
            email: "a@example.com",
            status: "APPLIED",
          },
          {
            id: "v2",
            storeName: "Verified Store",
            email: "v@example.com",
            status: "VERIFIED",
          },
        ],
      },
    },
  });

  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));

  expect(api.patch).toHaveBeenNthCalledWith(1, "/admin/vendors/v1/approve");
  expect(api.patch).toHaveBeenNthCalledWith(2, "/admin/vendors/v1/reject");
  expect(api.delete).toHaveBeenCalledWith("/admin/vendors/v2");
});
