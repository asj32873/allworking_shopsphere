import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";

/*
 * ---------------------------------------------------------
 * NORMALIZERS
 * ---------------------------------------------------------
 */

const normalizeOrder = (order) => ({
  ...order,

  id: order._id || order.id,

  userId: order.userId?._id || order.userId,

  addressId: order.addressId?._id || order.addressId,

  items: (order.items || []).map((item) => ({
    ...item,

    id: item._id || item.id,

    orderId: item.orderId?._id || item.orderId,

    productId: item.productId?._id || item.productId,

    vendorId: item.vendorId?._id || item.vendorId,

    tracking: item.tracking || [],
  })),
});

/*
 * ---------------------------------------------------------
 * LOAD USER ORDERS
 * ---------------------------------------------------------
 */

export const loadUserOrders = createAsyncThunk(
  "orders/loadUserOrders",

  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/orders");

      const orders = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      return orders.map(normalizeOrder);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load orders.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * LOAD VENDOR ORDERS
 * ---------------------------------------------------------
 */

export const loadVendorOrders = createAsyncThunk(
  "orders/loadVendorOrders",

  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/orders/vendor/list");

      const orders = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      return orders.map(normalizeOrder);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load vendor orders.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * LOAD ADMIN ORDERS
 * ---------------------------------------------------------
 */

export const loadAdminOrders = createAsyncThunk(
  "orders/loadAdminOrders",

  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/orders/admin/list");

      const orders = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      return orders.map(normalizeOrder);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load admin orders.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * LOAD SINGLE ORDER
 * ---------------------------------------------------------
 */

export const loadOrder = createAsyncThunk(
  "orders/loadOrder",

  async (id, { rejectWithValue }) => {
    try {
      const data = await api.get(`/orders/${id}`);

      return normalizeOrder(data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load order.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * CREATE ORDER
 * ---------------------------------------------------------
 */

export const placeOrder = createAsyncThunk(
  "orders/placeOrder",

  async (addressId, { rejectWithValue }) => {
    try {
      const data = await api.post("/orders", {
        addressId,
      });

      return normalizeOrder(data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to place order.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * UPDATE VENDOR ORDER STATUS
 * ---------------------------------------------------------
 */

export const updateVendorOrderStatus = createAsyncThunk(
  "orders/updateVendorOrderStatus",

  async ({ orderId, itemId, status }, { rejectWithValue }) => {
    try {
      const data = await api.patch(
        `/orders/vendor/${orderId}/items/${itemId}/status`,
        {
          status,
        },
      );

      return {
        orderId,
        itemId,
        status,
        data,
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to update order status.",
      );
    }
  },
);

/*
 * ---------------------------------------------------------
 * UPDATE ADMIN ORDER STATUS
 * ---------------------------------------------------------
 */

export const updateAdminOrderStatus = createAsyncThunk(
  "orders/updateAdminOrderStatus",

  async ({ orderId, itemId, status }, { rejectWithValue }) => {
    try {
      const data = await api.patch(
        `/orders/admin/${orderId}/items/${itemId}/status`,
        {
          status,
        },
      );

      return {
        orderId,
        itemId,
        status,
        data,
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to update order status.",
      );
    }
  },
);

/*
 * ---------------------------------------------------------
 * STRIPE CHECKOUT
 * ---------------------------------------------------------
 *
 * This was previously inside AppContext.jsx.
 * It is now a Redux async thunk.
 */

export const createCheckoutSession = createAsyncThunk(
  "orders/createCheckoutSession",

  async (addressId, { rejectWithValue }) => {
    try {
      const data = await api.post("/payments/create-checkout-session", {
        addressId,
      });

      return data;
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to start payment.");
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

  checkoutLoading: false,

  checkoutError: null,
};

/*
 * ---------------------------------------------------------
 * SLICE
 * ---------------------------------------------------------
 */

const orderSlice = createSlice({
  name: "orders",

  initialState,

  reducers: {
    clearOrders: (state) => {
      state.items = [];

      state.loading = false;

      state.error = null;

      state.checkoutLoading = false;

      state.checkoutError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
       * LOAD USER ORDERS
       */

      .addCase(loadUserOrders.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(loadUserOrders.fulfilled, (state, action) => {
        state.loading = false;

        state.items = action.payload;
      })

      .addCase(loadUserOrders.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      })

      /*
       * LOAD VENDOR ORDERS
       */

      .addCase(loadVendorOrders.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(loadVendorOrders.fulfilled, (state, action) => {
        state.loading = false;

        state.items = action.payload;
      })

      .addCase(loadVendorOrders.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      })

      /*
       * LOAD ADMIN ORDERS
       */

      .addCase(loadAdminOrders.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(loadAdminOrders.fulfilled, (state, action) => {
        state.loading = false;

        state.items = action.payload;
      })

      .addCase(loadAdminOrders.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      })

      /*
       * LOAD SINGLE ORDER
       */

      .addCase(loadOrder.fulfilled, (state, action) => {
        const order = action.payload;

        const index = state.items.findIndex(
          (item) => String(item.id) === String(order.id),
        );

        if (index >= 0) {
          state.items[index] = order;
        } else {
          state.items.unshift(order);
        }
      })

      /*
       * PLACE ORDER
       */

      .addCase(placeOrder.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;

        const order = action.payload;

        state.items = [
          order,
          ...state.items.filter((item) => String(item.id) !== String(order.id)),
        ];
      })

      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      })

      /*
       * UPDATE VENDOR STATUS
       */

      .addCase(updateVendorOrderStatus.fulfilled, (state, action) => {
        const { orderId, itemId, status, data } = action.payload;

        const order = state.items.find(
          (item) => String(item.id) === String(orderId),
        );

        if (!order) return;

        const item = order.items?.find(
          (orderItem) => String(orderItem.id) === String(itemId),
        );

        if (item) {
          Object.assign(item, data || {});

          item.id = itemId;

          item.vendorStatus = status;
        }
      })

      /*
       * UPDATE ADMIN STATUS
       */

      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        const { orderId, itemId, status, data } = action.payload;

        const order = state.items.find(
          (item) => String(item.id) === String(orderId),
        );

        if (!order) return;

        const item = order.items?.find(
          (orderItem) => String(orderItem.id) === String(itemId),
        );

        if (item) {
          Object.assign(item, data || {});

          item.id = itemId;

          item.vendorStatus = status;
        }
      })

      /*
       * STRIPE CHECKOUT
       */

      .addCase(createCheckoutSession.pending, (state) => {
        state.checkoutLoading = true;

        state.checkoutError = null;
      })

      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.checkoutLoading = false;
      })

      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.checkoutLoading = false;

        state.checkoutError = action.payload;
      });
  },
});

/*
 * ---------------------------------------------------------
 * EXPORTS
 * ---------------------------------------------------------
 */

export const { clearOrders } = orderSlice.actions;

export default orderSlice.reducer;
