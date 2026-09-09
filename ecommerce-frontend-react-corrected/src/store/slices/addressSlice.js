import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

/*
 * ---------------------------------------------------------
 * NORMALIZE ADDRESS
 * ---------------------------------------------------------
 */
const normalizeAddress = (address) => ({
  ...address,
  id: address._id || address.id,
  userId: address.userId?._id || address.userId,
});

/*
 * ---------------------------------------------------------
 * LOAD ADDRESSES
 * ---------------------------------------------------------
 */
export const loadAddresses = createAsyncThunk(
  "addresses/loadAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/addresses");

      const addresses = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      return addresses.map(normalizeAddress);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load addresses.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * ADD ADDRESS
 * ---------------------------------------------------------
 */
export const addAddress = createAsyncThunk(
  "addresses/addAddress",
  async (data, { rejectWithValue }) => {
    try {
      const created = await api.post("/addresses", data);

      return normalizeAddress(created);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add address.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * UPDATE ADDRESS
 * ---------------------------------------------------------
 */
export const updateAddress = createAsyncThunk(
  "addresses/updateAddress",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await api.put(`/addresses/${id}`, data);

      return normalizeAddress(updated);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update address.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * DELETE ADDRESS
 * ---------------------------------------------------------
 */
export const deleteAddress = createAsyncThunk(
  "addresses/deleteAddress",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/addresses/${id}`);

      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete address.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * SET DEFAULT ADDRESS
 * ---------------------------------------------------------
 */
export const setDefaultAddress = createAsyncThunk(
  "addresses/setDefaultAddress",
  async (id, { rejectWithValue }) => {
    try {
      const updated = await api.patch(`/addresses/${id}/default`, {});

      return normalizeAddress(updated);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to set default address.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * INITIAL STATE
 * ---------------------------------------------------------
 */
const initialState = {
  items: [],
  loading: false,
  error: null,
};

/*
 * ---------------------------------------------------------
 * ADDRESS SLICE
 * ---------------------------------------------------------
 */
const addressSlice = createSlice({
  name: "addresses",

  initialState,

  reducers: {
    setAddresses: (state, action) => {
      state.items = action.payload;
    },

    clearAddresses: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
       * LOAD ADDRESSES
       */
      .addCase(loadAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loadAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      .addCase(loadAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load addresses.";
      })

      /*
       * ADD ADDRESS
       */
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;

        state.items.unshift(action.payload);
      })

      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to add address.";
      })

      /*
       * UPDATE ADDRESS
       */
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;

        const updatedAddress = action.payload;

        state.items = state.items.map((address) =>
          String(address.id) === String(updatedAddress.id)
            ? updatedAddress
            : address,
        );
      })

      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update address.";
      })

      /*
       * DELETE ADDRESS
       */
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;

        state.items = state.items.filter(
          (address) => String(address.id) !== String(action.payload),
        );
      })

      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete address.";
      })

      /*
       * SET DEFAULT ADDRESS
       */
      .addCase(setDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.loading = false;

        const defaultAddress = action.payload;

        state.items = state.items.map((address) => ({
          ...address,

          isDefault: String(address.id) === String(defaultAddress.id),
        }));
      })

      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to set default address.";
      });
  },
});

/*
 * ---------------------------------------------------------
 * EXPORT NORMAL ACTIONS
 * ---------------------------------------------------------
 */
export const { setAddresses, clearAddresses } = addressSlice.actions;

export default addressSlice.reducer;
