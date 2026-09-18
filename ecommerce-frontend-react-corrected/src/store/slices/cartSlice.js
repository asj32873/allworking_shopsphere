import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

const normalizeProduct = (p = {}) => ({
  ...p,
  id: p._id || p.id,
  image: p.imageUrl || p.image || "",
});

const normalizeCartItem = (item = {}) => ({
  ...item,
  id: item._id || item.id,
  productId: item.productId?._id || item.productId,
  product: item.product ? normalizeProduct(item.product) : null,
});

/*
 * =========================================================
 * LOAD CART
 * =========================================================
 */

export const loadCart = createAsyncThunk(
  "cart/loadCart",
  async (_, { getState, rejectWithValue }) => {
    try {
      const user = getState().auth.user;

      if (!user || user.role !== "USER") {
        return [];
      }

      const data = await api.get("/cart");

      const cartData = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      return cartData.map(normalizeCartItem);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load cart.");
    }
  },
);

/*
 * =========================================================
 * ADD TO CART
 * =========================================================
 */

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (
    { product, quantity = 1 },
    { dispatch, getState, rejectWithValue },
  ) => {
    try {
      const user = getState().auth.user;

      if (!user || user.role !== "USER") {
        throw new Error("Please login as a user first.");
      }

      if (!product?.stock) {
        throw new Error("Product is out of stock.");
      }

      await api.post("/cart/items", {
        productId: product._id || product.id,
        quantity,
      });

      await dispatch(loadCart()).unwrap();

      return true;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add item to cart.");
    }
  },
);

/*
 * =========================================================
 * REMOVE FROM CART
 * id = PRODUCT ID
 * =========================================================
 */

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (productId, { getState, dispatch, rejectWithValue }) => {
    try {
      const items = getState().cart.items;

      const item = items.find((x) => String(x.productId) === String(productId));

      if (!item) {
        throw new Error("Cart item not found.");
      }

      await api.delete(`/cart/items/${item.id}`);

      await dispatch(loadCart()).unwrap();

      return productId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to remove cart item.");
    }
  },
);

/*
 * =========================================================
 * UPDATE CART QUANTITY
 * id = PRODUCT ID
 * =========================================================
 */

export const updateCartQty = createAsyncThunk(
  "cart/updateCartQty",
  async ({ id, quantity }, { getState, dispatch, rejectWithValue }) => {
    try {
      const items = getState().cart.items;

      const item = items.find((x) => String(x.productId) === String(id));

      if (!item) {
        throw new Error("Cart item not found.");
      }

      if (Number(quantity) <= 0) {
        await api.delete(`/cart/items/${item.id}`);

        await dispatch(loadCart()).unwrap();

        return true;
      }

      await api.patch(`/cart/items/${item.id}`, {
        quantity: Number(quantity),
      });

      await dispatch(loadCart()).unwrap();

      return true;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update cart.");
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
  total: 0,
  loading: false,
  error: null,
};

/*
 * =========================================================
 * HELPER
 * =========================================================
 */

const calculateTotal = (items) =>
  items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

/*
 * =========================================================
 * SLICE
 * =========================================================
 */

const cartSlice = createSlice({
  name: "cart",

  initialState,

  reducers: {
    setCart: (state, action) => {
      state.items = action.payload || [];
      state.total = calculateTotal(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
       * LOAD CART
       */

      .addCase(loadCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loadCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.total = calculateTotal(action.payload);
      })

      .addCase(loadCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load cart.";
        state.items = [];
        state.total = 0;
      })

      /*
       * ADD TO CART
       */

      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(addToCart.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to add item to cart.";
      })

      /*
       * REMOVE FROM CART
       */

      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(removeFromCart.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to remove cart item.";
      })

      /*
       * UPDATE CART QUANTITY
       */

      .addCase(updateCartQty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateCartQty.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(updateCartQty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update cart.";
      });
  },
});

export const { setCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
