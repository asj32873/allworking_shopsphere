import { screen } from "@testing-library/react";

import VendorProfile from "../../../src/pages/vendor/VendorProfile";
import { renderWithProviders } from "../../utils/testUtils";

test("VendorProfile renders the current vendor profile", () => {
  renderWithProviders(<VendorProfile />, {
    preloadedState: {
      auth: {
        user: { id: "u-v1", email: "vendor@example.com", role: "VENDOR" },
      },
      vendors: {
        items: [
          {
            userId: "u-v1",
            storeName: "Asha Store",
            storeAddress: "1 Main St",
            status: "VERIFIED",
          },
        ],
      },
    },
  });

  expect(
    screen.getByRole("heading", { name: "Vendor Profile" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Asha Store")).toBeInTheDocument();
  expect(screen.getByText("vendor@example.com")).toBeInTheDocument();
  expect(screen.getByText("1 Main St")).toBeInTheDocument();
  expect(screen.getByText("VERIFIED")).toBeInTheDocument();
});
