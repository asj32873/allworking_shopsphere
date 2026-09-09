import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

/*
 * =========================================================
 * NORMALIZE PRODUCT
 * =========================================================
 */

const normalizeProduct = (p = {}) => ({
  ...p,
  id: p._id || p.id,
  image: p.imageUrl || p.image || "",

  vendor: p.vendor
    ? {
        ...p.vendor,
        id: p.vendor._id || p.vendor.id,
        userId: p.vendor.userId?._id || p.vendor.userId,
      }
    : null,
});

/*
 * =========================================================
 * LOAD PRODUCTS
 * =========================================================
 */

export const loadProducts = createAsyncThunk(
  "products/loadProducts",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/products?limit=100");

      const products = Array.isArray(data)
        ? data
        : data?.items || data?.data || [];

      return products.map(normalizeProduct);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load products.");
    }
  },
);

/*
 * =========================================================
 * ADD PRODUCT
 * =========================================================
 */

export const addProduct = createAsyncThunk(
  "products/addProduct",
  async (data, { rejectWithValue }) => {
    try {
      const created = await api.post("/products", {
        ...data,
        imageUrl: data.image || data.imageUrl || "",
      });

      return normalizeProduct(created);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add product.");
    }
  },
);

/*
 * =========================================================
 * UPDATE PRODUCT
 * =========================================================
 */

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await api.put(`/products/${id}`, {
        ...data,
        imageUrl: data.image || data.imageUrl || "",
      });

      return normalizeProduct(updated);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update product.");
    }
  },
);

/*
 * =========================================================
 * DELETE PRODUCT
 * =========================================================
 */

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);

      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete product.");
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
 * PRODUCT SLICE
 * =========================================================
 */

const productSlice = createSlice({
  name: "products",

  initialState,

  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload || [];
    },

    clearProducts: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
       * LOAD PRODUCTS
       */

      .addCase(loadProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loadProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      .addCase(loadProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load products.";
      })

      /*
       * ADD PRODUCT
       */

      .addCase(addProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;

        state.items.unshift(action.payload);
      })

      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Failed to add product.";
      })

      /*
       * UPDATE PRODUCT
       */

      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;

        const updatedProduct = action.payload;

        const index = state.items.findIndex(
          (product) => String(product.id) === String(updatedProduct.id),
        );

        if (index !== -1) {
          state.items[index] = updatedProduct;
        }
      })

      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Failed to update product.";
      })

      /*
       * DELETE PRODUCT
       */

      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;

        state.items = state.items.filter(
          (product) => String(product.id) !== String(action.payload),
        );
      })

      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Failed to delete product.";
      });
  },
});

export const { setProducts, clearProducts } = productSlice.actions;

export default productSlice.reducer;
