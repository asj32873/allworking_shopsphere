import { act } from "@testing-library/react";
import AppBootstrap from "../../src/store/AppBootstrap";
import { renderWithProviders } from "../utils/testUtils";
import { api } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  configureAccessTokenGetter: jest.fn(),
}));

const mockUseAuth0 = jest.fn();

jest.mock("@auth0/auth0-react", () => ({
  useAuth0: () => mockUseAuth0(),
}));

describe("AppBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    api.get.mockResolvedValue({});
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      getAccessTokenSilently: jest.fn(),
    });
  });

  test("always loads products on mount", async () => {
    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>);
    });

    expect(api.get).toHaveBeenCalledWith("/products?limit=100");
  });

  test("skips auth bootstrap while auth0 is still loading", async () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      getAccessTokenSilently: jest.fn(),
    });

    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>);
    });

    expect(api.get).not.toHaveBeenCalledWith("/auth/me");
  });

  test("skips auth bootstrap when already initialized", async () => {
    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>, {
        preloadedState: {
          auth: {
            token: null,
            user: null,
            loading: false,
            initialized: true,
            error: null,
          },
        },
      });
    });

    expect(api.get).not.toHaveBeenCalledWith("/auth/me");
  });

  test("uses existing ShopSphere JWT and loads USER-specific data", async () => {
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "/auth/me") {
        return Promise.resolve({ id: "u1", role: "USER" });
      }
      return Promise.resolve({});
    });

    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>, {
        preloadedState: {
          auth: {
            token: "existing-jwt",
            user: null,
            loading: false,
            initialized: false,
            error: null,
          },
        },
      });
    });

    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(api.get).toHaveBeenCalledWith("/cart");
    expect(api.get).toHaveBeenCalledWith("/orders");
    expect(api.get).toHaveBeenCalledWith("/addresses");
    expect(api.get).toHaveBeenCalledWith("/issues");
  });

  test("loads VENDOR-specific data", async () => {
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "/auth/me") {
        return Promise.resolve({ id: "v1", role: "VENDOR" });
      }
      return Promise.resolve({});
    });

    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>, {
        preloadedState: {
          auth: {
            token: "existing-jwt",
            user: null,
            loading: false,
            initialized: false,
            error: null,
          },
        },
      });
    });

    expect(api.get).toHaveBeenCalledWith("/vendors/profile");
    expect(api.get).toHaveBeenCalledWith("/orders/vendor/list");
    expect(api.get).toHaveBeenCalledWith("/issues");
  });

  test("loads ADMIN-specific data", async () => {
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "/auth/me") {
        return Promise.resolve({ id: "a1", role: "ADMIN" });
      }
      return Promise.resolve({});
    });

    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>, {
        preloadedState: {
          auth: {
            token: "existing-jwt",
            user: null,
            loading: false,
            initialized: false,
            error: null,
          },
        },
      });
    });

    expect(api.get).toHaveBeenCalledWith("/admin/users");
    expect(api.get).toHaveBeenCalledWith("/admin/vendors");
    expect(api.get).toHaveBeenCalledWith("/orders/admin/list");
    expect(api.get).toHaveBeenCalledWith("/issues");
  });

  test("falls back to Auth0 exchange when the JWT is invalid", async () => {
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "/auth/me") {
        return Promise.reject({ message: "invalid token" });
      }
      return Promise.resolve({});
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { token: "new-jwt", user: { id: "u2", role: "USER" } },
      }),
    });

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: jest.fn().mockResolvedValue("auth0-access-token"),
    });

    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>, {
        preloadedState: {
          auth: {
            token: "stale-jwt",
            user: null,
            loading: false,
            initialized: false,
            error: null,
          },
        },
      });
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  test("handles bootstrap failures gracefully", async () => {
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "/auth/me") {
        return Promise.reject({ message: "invalid token" });
      }
      return Promise.resolve({});
    });

    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      getAccessTokenSilently: jest.fn(),
    });

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<AppBootstrap>child</AppBootstrap>, {
        preloadedState: {
          auth: {
            token: "stale-jwt",
            user: null,
            loading: false,
            initialized: false,
            error: null,
          },
        },
      });
    });

    errorSpy.mockRestore();
  });
});
