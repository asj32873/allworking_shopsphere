import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../api/client";

/*
 * =========================================================
 * NORMALIZE USER
 * =========================================================
 */

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    id: user._id || user.id,
  };
};

/*
 * =========================================================
 * LOAD ADMIN USERS
 * =========================================================
 */

export const loadAdminUsers = createAsyncThunk(
  "users/loadAdminUsers",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/admin/users");

      const users = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      return users.map(normalizeUser);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load users");
    }
  },
);

/*
 * =========================================================
 * UPDATE USER STATUS
 * =========================================================
 */

export const updateUserStatus = createAsyncThunk(
  "users/updateUserStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await api.patch(`/admin/users/${id}/status`, {
        status,
      });

      return normalizeUser(data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to update user status");
    }
  },
);

/*
 * =========================================================
 * DELETE USER
 * =========================================================
 */

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${id}`);

      return id;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to delete user");
    }
  },
);

/*
 * =========================================================
 * INITIAL STATE
 * =========================================================
 */

const initialState = {
  items: [],
  loading: false,
  error: null,
};

/*
 * =========================================================
 * USER SLICE
 * =========================================================
 */

const userSlice = createSlice({
  name: "users",

  initialState,

  reducers: {
    clearUsers: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /*
     * LOAD ADMIN USERS
     */

    builder
      .addCase(loadAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loadAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      .addCase(loadAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * UPDATE USER STATUS
     */

    builder
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;

        const updatedUser = action.payload;

        const index = state.items.findIndex(
          (user) => String(user.id) === String(updatedUser.id),
        );

        if (index !== -1) {
          state.items[index] = updatedUser;
        }
      })

      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * DELETE USER
     */

    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;

        state.items = state.items.filter(
          (user) => String(user.id) !== String(action.payload),
        );
      })

      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/*
 * =========================================================
 * EXPORT ACTIONS
 * =========================================================
 */

export const { clearUsers } = userSlice.actions;

/*
 * =========================================================
 * EXPORT REDUCER
 * =========================================================
 */

export default userSlice.reducer;
