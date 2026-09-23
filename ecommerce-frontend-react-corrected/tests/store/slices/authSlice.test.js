import authReducer, {
  logout,
  finishBootstrap,
  clearAuthError,
  login,
  loadAuthenticatedUser,
  exchangeAuth0Token,
  registerUser,
  registerVendor,
} from "../../../src/store/slices/authSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("authSlice", () => {
  const initialState = {
    token: null,
    user: null,
    loading: true,
    initialized: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("reducers", () => {
    test("logout resets auth state and removes token from localStorage", () => {
      localStorage.setItem("shopsphere_token", "jwt-token");
      const loggedInState = {
        token: "jwt-token",
        user: { id: "u1", name: "User" },
        loading: false,
        initialized: true,
        error: "some-error",
      };

      const state = authReducer(loggedInState, logout());

      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
      expect(state.error).toBeNull();
      expect(localStorage.getItem("shopsphere_token")).toBeNull();
    });

    test("finishBootstrap marks initialization as complete", () => {
      const state = authReducer(initialState, finishBootstrap());

      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
      expect(state.error).toBeNull();
    });

    test("clearAuthError resets error state", () => {
      const stateWithError = { ...initialState, error: "Authentication failed" };
      const state = authReducer(stateWithError, clearAuthError());

      expect(state.error).toBeNull();
    });
  });

  describe("async thunks", () => {
    describe("login", () => {
      test("handles successful login", async () => {
        const mockUser = { _id: "usr-1", name: "Alice", email: "alice@test.com" };
        api.post.mockResolvedValueOnce({
          token: "jwt-xyz",
          user: mockUser,
        });

        const dispatch = jest.fn();
        const thunk = login({ email: "alice@test.com", password: "password123" });
        const result = await thunk(dispatch, () => ({}), undefined);

        expect(result.type).toBe("auth/login/fulfilled");
        expect(result.payload).toEqual({
          token: "jwt-xyz",
          user: { ...mockUser, id: "usr-1" },
        });
        expect(localStorage.getItem("shopsphere_token")).toBe("jwt-xyz");
      });

      test("handles login failure", async () => {
        api.post.mockRejectedValueOnce(new Error("Invalid credentials"));

        const dispatch = jest.fn();
        const thunk = login({ email: "alice@test.com", password: "wrong" });
        const result = await thunk(dispatch, () => ({}), undefined);

        expect(result.type).toBe("auth/login/rejected");
        expect(result.payload).toBe("Invalid credentials");
      });

      test("updates state on login lifecycle", () => {
        let state = authReducer(initialState, { type: login.pending.type });
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();

        state = authReducer(state, {
          type: login.fulfilled.type,
          payload: { token: "token-1", user: { id: "u1" } },
        });
        expect(state.loading).toBe(false);
        expect(state.initialized).toBe(true);
        expect(state.token).toBe("token-1");
        expect(state.user).toEqual({ id: "u1" });

        state = authReducer(state, {
          type: login.rejected.type,
          payload: "Error message",
        });
        expect(state.loading).toBe(false);
        expect(state.error).toBe("Error message");
      });
    });

    describe("loadAuthenticatedUser", () => {
      test("handles successful user load", async () => {
        api.get.mockResolvedValueOnce({ _id: "u-1", name: "Loaded User" });

        const dispatch = jest.fn();
        const thunk = loadAuthenticatedUser();
        const result = await thunk(dispatch, () => ({}), undefined);

        expect(result.type).toBe("auth/loadAuthenticatedUser/fulfilled");
        expect(result.payload).toEqual({
          _id: "u-1",
          id: "u-1",
          name: "Loaded User",
        });
      });

      test("handles load failure and removes token on 401", async () => {
        localStorage.setItem("shopsphere_token", "invalid-token");
        const error = new Error("Unauthorized");
        error.status = 401;
        api.get.mockRejectedValueOnce(error);

        const dispatch = jest.fn();
        const thunk = loadAuthenticatedUser();
        const result = await thunk(dispatch, () => ({}), undefined);

        expect(result.type).toBe("auth/loadAuthenticatedUser/rejected");
        expect(localStorage.getItem("shopsphere_token")).toBeNull();
      });
    });

    describe("exchangeAuth0Token", () => {
      test("rejects when token is missing", async () => {
        const dispatch = jest.fn();
        const thunk = exchangeAuth0Token(null);
        const result = await thunk(dispatch, () => ({}), undefined);

        expect(result.type).toBe("auth/exchangeAuth0Token/rejected");
        expect(result.payload).toBe("Auth0 access token is missing.");
      });

      test("handles successful Auth0 exchange", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              token: "shopsphere-jwt",
              user: { _id: "auth0-u1", name: "Auth0 User" },
            },
          }),
        });

        const dispatch = jest.fn();
        const thunk = exchangeAuth0Token("auth0-token-abc");
        const result = await thunk(dispatch, () => ({}), undefined);

        expect(result.type).toBe("auth/exchangeAuth0Token/fulfilled");
        expect(result.payload.token).toBe("shopsphere-jwt");
        expect(result.payload.user.id).toBe("auth0-u1");
      });
    });

    describe("registration thunks", () => {
      test("registerUser dispatches api.post to /auth/register", async () => {
        api.post.mockResolvedValueOnce({ success: true });

        const dispatch = jest.fn();
        const payload = { name: "New", email: "new@test.com", password: "pwd" };
        const result = await registerUser(payload)(dispatch, () => ({}), undefined);

        expect(api.post).toHaveBeenCalledWith("/auth/register", payload);
        expect(result.type).toBe("auth/registerUser/fulfilled");
      });

      test("registerVendor dispatches api.post to /auth/vendor/register", async () => {
        api.post.mockResolvedValueOnce({ success: true });

        const dispatch = jest.fn();
        const payload = { storeName: "Vendor Store", email: "v@test.com" };
        const result = await registerVendor(payload)(dispatch, () => ({}), undefined);

        expect(api.post).toHaveBeenCalledWith("/auth/vendor/register", payload);
        expect(result.type).toBe("auth/registerVendor/fulfilled");
      });
    });
  });
});
