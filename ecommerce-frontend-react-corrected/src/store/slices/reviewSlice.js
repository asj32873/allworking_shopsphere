import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

/*
 * ---------------------------------------------------------
 * NORMALIZE REVIEW
 * ---------------------------------------------------------
 */
const normalizeReview = (r) => ({
  ...r,

  id: r._id || r.id,

  productId: r.productId?._id || r.productId,

  userId: r.userId?._id || r.userId,

  user: r.userId?.name
    ? {
        id: r.userId._id,
        name: r.userId.name,
      }
    : null,
});

/*
 * ---------------------------------------------------------
 * LOAD PRODUCT REVIEWS
 * ---------------------------------------------------------
 */
export const loadProductReviews = createAsyncThunk(
  "reviews/loadProductReviews",

  async (productId, { rejectWithValue }) => {
    try {
      const data = await api.get(`/reviews/product/${productId}`);

      return {
        productId,

        reviews: (data || []).map(normalizeReview),
      };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load product reviews.",
      );
    }
  },
);

/*
 * ---------------------------------------------------------
 * LOAD ALL REVIEWS
 * ---------------------------------------------------------
 */
export const loadReviews = createAsyncThunk(
  "reviews/loadReviews",

  async (_, { rejectWithValue }) => {
    try {
      const productsData = await api.get("/products?limit=100");

      const products = productsData?.items || productsData?.data || [];

      const results = await Promise.all(
        products.map((product) =>
          api
            .get(`/reviews/product/${product._id || product.id}`)
            .catch(() => []),
        ),
      );

      return results.flat().map(normalizeReview);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load reviews.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * ADD REVIEW
 * ---------------------------------------------------------
 */
export const addReview = createAsyncThunk(
  "reviews/addReview",

  async ({ productId, rating, review }, { getState, rejectWithValue }) => {
    try {
      const created = await api.post(`/reviews/product/${productId}`, {
        rating: Number(rating),

        review: review.trim(),
      });

      const normalized = normalizeReview(created);

      const user = getState().auth.user;

      return {
        review: normalized,

        userId: user?._id || user?.id,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add review.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * UPDATE REVIEW
 * ---------------------------------------------------------
 */
export const updateReview = createAsyncThunk(
  "reviews/updateReview",

  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await api.put(`/reviews/${id}`, data);

      return normalizeReview(updated);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update review.");
    }
  },
);

/*
 * ---------------------------------------------------------
 * DELETE REVIEW
 * ---------------------------------------------------------
 */
export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",

  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/reviews/${id}`);

      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete review.");
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
 * SLICE
 * ---------------------------------------------------------
 */
const reviewSlice = createSlice({
  name: "reviews",

  initialState,

  reducers: {
    setReviews: (state, action) => {
      state.items = action.payload;
    },

    clearReviews: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
       * LOAD PRODUCT REVIEWS
       */
      .addCase(loadProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loadProductReviews.fulfilled, (state, action) => {
        state.loading = false;

        const { productId, reviews } = action.payload;

        state.items = [
          ...state.items.filter(
            (review) => String(review.productId) !== String(productId),
          ),

          ...reviews,
        ];
      })

      .addCase(loadProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load reviews.";
      })

      /*
       * LOAD ALL REVIEWS
       */
      .addCase(loadReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loadReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      .addCase(loadReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load reviews.";
      })

      /*
       * ADD REVIEW
       */
      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;

        const { review, userId } = action.payload;

        state.items = [
          review,

          ...state.items.filter(
            (item) =>
              !(
                String(item.productId) === String(review.productId) &&
                String(item.userId) === String(userId)
              ),
          ),
        ];
      })

      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to add review.";
      })

      /*
       * UPDATE REVIEW
       */
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;

        const updatedReview = action.payload;

        state.items = state.items.map((review) =>
          String(review.id) === String(updatedReview.id)
            ? updatedReview
            : review,
        );
      })

      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update review.";
      })

      /*
       * DELETE REVIEW
       */
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;

        state.items = state.items.filter(
          (review) => String(review.id) !== String(action.payload),
        );
      })

      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete review.";
      });
  },
});

/*
 * ---------------------------------------------------------
 * EXPORT ACTIONS
 * ---------------------------------------------------------
 */
export const { setReviews, clearReviews } = reviewSlice.actions;

export default reviewSlice.reducer;
