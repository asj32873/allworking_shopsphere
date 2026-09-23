import { screen } from "@testing-library/react";

import Profile from "../../src/pages/Profile";
import { renderWithProviders } from "../utils/testUtils";

describe("Profile", () => {
  test("renders user details, owned addresses, counts, and navigation links", () => {
    renderWithProviders(<Profile />, {
      preloadedState: {
        auth: {
          user: {
            id: "u1",
            name: "Asha",
            email: "asha@example.com",
            role: "USER",
          },
        },
        addresses: {
          items: [
            {
              id: "a1",
              userId: "u1",
              type: "Home",
              addressLine: "1 Main St",
              city: "Pune",
              pincode: "411001",
            },
            {
              id: "a2",
              userId: "u2",
              type: "Work",
              addressLine: "2 Other St",
              city: "Delhi",
              pincode: "110001",
            },
          ],
        },
        orders: {
          items: [
            { id: "o1", userId: "u1" },
            { id: "o2", userId: "u2" },
          ],
        },
        reviews: {
          items: [
            { id: "r1", userId: "u1" },
            { id: "r2", userId: "u2" },
          ],
        },
        issues: {
          items: [
            { id: "i1", userId: "u1" },
            { id: "i2", userId: "u2" },
          ],
        },
      },
    });

    expect(screen.getByRole("heading", { name: "Asha" })).toBeInTheDocument();
    expect(screen.getByText("asha@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("Home: 1 Main St, Pune - 411001"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Work: 2 Other St, Delhi - 110001"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Orders").previousElementSibling).toHaveTextContent(
      "1",
    );
    expect(
      screen.getByText("Reviews").previousElementSibling,
    ).toHaveTextContent("1");
    expect(screen.getByText("Issues").previousElementSibling).toHaveTextContent(
      "1",
    );
    expect(screen.getByRole("link", { name: "Manage" })).toHaveAttribute(
      "href",
      "/profile/addresses",
    );
    expect(screen.getByRole("link", { name: "My Reviews" })).toHaveAttribute(
      "href",
      "/profile/reviews",
    );
    expect(screen.getByRole("link", { name: "My Issues" })).toHaveAttribute(
      "href",
      "/profile/issues",
    );
  });
});
