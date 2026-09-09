import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

/*
 * Normalize MongoDB/API IDs.
 */
const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user._id || user.id,
  };
};

/*
 * ---------------------------------------------------------
 * EMAIL / PASSWORD LOGIN
 * ---------------------------------------------------------
 */
export const login = createAsyncThunk(
  "auth/login",

  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await api.post("/auth/login", {
        email,
        password,
      });

      const token = data?.token;
      const user = normalizeUser(data?.user);

      if (!token) {
        throw new Error("Authentication succeeded but no token was returned.");
      }

      localStorage.setItem("shopsphere_token", token);

      return {
        token,
        user,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Login failed.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * LOAD EXISTING SHOPSPHERE USER
 * ---------------------------------------------------------
 */
export const loadAuthenticatedUser = createAsyncThunk(
  "auth/loadAuthenticatedUser",

  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/auth/me");

      return normalizeUser(data);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem("shopsphere_token");
      }

      return rejectWithValue(error.message || "Authentication failed.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * EXCHANGE AUTH0 TOKEN
 *
 * Auth0 access token
 *        ↓
 * POST /auth/auth0/login
 *        ↓
 * ShopSphere JWT
 * ---------------------------------------------------------
 */
export const exchangeAuth0Token = createAsyncThunk(
  "auth/exchangeAuth0Token",

  async (auth0Token, { rejectWithValue }) => {
    try {
      if (!auth0Token) {
        throw new Error("Auth0 access token is missing.");
      }

      const response = await fetch(`${API_URL}/auth/auth0/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          token: auth0Token,
        }),
      });

      let result = null;

      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid response from authentication server.");
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Unable to authenticate with Auth0.",
        );
      }

      const token = result?.data?.token;

      const user = normalizeUser(result?.data?.user);

      if (!token) {
        throw new Error("ShopSphere authentication token was not returned.");
      }

      localStorage.setItem("shopsphere_token", token);

      return {
        token,
        user,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Auth0 authentication failed.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * REGISTER USER
 * ---------------------------------------------------------
 */
export const registerUser = createAsyncThunk(
  "auth/registerUser",

  async (payload, { rejectWithValue }) => {
    try {
      return await api.post("/auth/register", payload);
    } catch (error) {
      return rejectWithValue(error.message || "Registration failed.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * REGISTER VENDOR
 * ---------------------------------------------------------
 */
export const registerVendor = createAsyncThunk(
  "auth/registerVendor",

  async (payload, { rejectWithValue }) => {
    try {
      return await api.post("/auth/vendor/register", payload);
    } catch (error) {
      return rejectWithValue(error.message || "Vendor registration failed.");
    }
  },
);

const initialState = {
  token: localStorage.getItem("shopsphere_token") || null,

  user: null,

  /*
   * This is important.
   *
   * ProtectedRoute must wait while the
   * authentication bootstrap is running.
   */
  loading: true,

  initialized: false,

  error: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout: (state) => {
      localStorage.removeItem("shopsphere_token");

      state.token = null;
      state.user = null;
      state.loading = false;
      state.initialized = true;
      state.error = null;
    },

    finishBootstrap: (state) => {
      state.loading = false;
      state.initialized = true;
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /*
     * EMAIL LOGIN
     */
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
        state.initialized = true;
        state.error = null;
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = action.payload;
      });

    /*
     * LOAD EXISTING USER
     */
    builder
      .addCase(loadAuthenticatedUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loadAuthenticatedUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.initialized = true;
        state.error = null;
      })

      .addCase(loadAuthenticatedUser.rejected, (state, action) => {
        /*
         * Invalid JWT → remove it.
         */
        localStorage.removeItem("shopsphere_token");

        state.token = null;
        state.user = null;
        state.loading = false;
        state.initialized = true;
        state.error = action.payload;
      });

    /*
     * AUTH0 EXCHANGE
     */
    builder
      .addCase(exchangeAuth0Token.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(exchangeAuth0Token.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
        state.initialized = true;
        state.error = null;
      })

      .addCase(exchangeAuth0Token.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = action.payload;
      });
  },
});

export const { logout, finishBootstrap, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
