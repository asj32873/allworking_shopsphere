import { fireEvent, screen } from "@testing-library/react";

import AdminUsers from "../../../src/pages/admin/AdminUsers";
import { api } from "../../../src/api/client";
import { renderWithProviders } from "../../utils/testUtils";

jest.mock("../../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("AdminUsers renders users and protects admins and current user", () => {
  api.patch.mockResolvedValue({ id: "u1" });

  renderWithProviders(<AdminUsers />, {
    preloadedState: {
      auth: { user: { id: "admin-1", role: "ADMIN" } },
      users: {
        items: [
          {
            id: "u1",
            name: "Asha",
            email: "asha@example.com",
            role: "USER",
            status: "ACTIVE",
          },
          {
            id: "u2",
            name: "Disabled",
            email: "disabled@example.com",
            role: "USER",
            status: "DISABLED",
          },
          {
            id: "admin-1",
            name: "Admin",
            email: "admin@example.com",
            role: "ADMIN",
            status: "ACTIVE",
          },
        ],
      },
    },
  });

  expect(screen.getByText("Asha")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
  expect(screen.getAllByRole("button")).toHaveLength(2);

  fireEvent.click(screen.getByRole("button", { name: "Disable" }));
  expect(api.patch).toHaveBeenCalledWith("/admin/users/u1/status", {
    status: "DISABLED",
  });
});
