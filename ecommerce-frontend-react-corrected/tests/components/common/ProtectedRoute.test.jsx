import React from "react";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../../src/components/common/ProtectedRoute";
import { renderWithProviders } from "../../utils/testUtils";

describe("ProtectedRoute component", () => {
  const TestApp = ({ roles }) => (
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/" element={<div>Home Page</div>} />
      <Route element={<ProtectedRoute roles={roles} />}>
        <Route path="/protected" element={<div>Protected Content</div>} />
      </Route>
    </Routes>
  );

  test("shows loading spinner when authentication bootstrap is in progress", () => {
    renderWithProviders(<TestApp roles={["USER"]} />, {
      preloadedState: {
        auth: { user: null, loading: true },
      },
      route: "/protected",
    });

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  test("redirects unauthenticated user to /login", () => {
    renderWithProviders(<TestApp roles={["USER"]} />, {
      preloadedState: {
        auth: { user: null, loading: false },
      },
      route: "/protected",
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("redirects unauthorized user to / when role does not match", () => {
    renderWithProviders(<TestApp roles={["ADMIN"]} />, {
      preloadedState: {
        auth: { user: { role: "USER" }, loading: false },
      },
      route: "/protected",
    });

    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  test("renders protected content when user has required role", () => {
    renderWithProviders(<TestApp roles={["USER"]} />, {
      preloadedState: {
        auth: { user: { role: "USER" }, loading: false },
      },
      route: "/protected",
    });

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
