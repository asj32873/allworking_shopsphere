import React from "react";
import { screen } from "@testing-library/react";
import RoleSidebar from "../../../src/components/common/RoleSidebar";
import { renderWithProviders } from "../../utils/testUtils";

describe("RoleSidebar component", () => {
  test("renders vendor sidebar navigation items", () => {
    renderWithProviders(<RoleSidebar type="vendor" />, {
      route: "/vendor/dashboard",
    });

    expect(screen.getByText("vendor portal")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  test("renders admin sidebar navigation items", () => {
    renderWithProviders(<RoleSidebar type="admin" />, {
      route: "/admin/dashboard",
    });

    expect(screen.getByText("admin portal")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Vendors")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Reviews")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
  });
});
