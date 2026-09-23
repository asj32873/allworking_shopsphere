import reviewReducer, {
  clearReviews,
  setReviews,
  loadProductReviews,
  loadReviews,
  addReview,
  updateReview,
  deleteReview,
} from "../../../src/store/slices/reviewSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("reviewSlice", () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("clearReviews resets reviews state", () => {
      const state = reviewReducer(
        { items: [{ id: "r1" }], loading: false, error: "err" },
        clearReviews(),
      );

      expect(state.items).toEqual([]);
      expect(state.error).toBeNull();
    });

    test("setReviews replaces the reviews list", () => {
      const state = reviewReducer(initialState, setReviews([{ id: "r9" }]));

      expect(state.items).toEqual([{ id: "r9" }]);
    });

    test("pending actions set loading and clear error for every review thunk", () => {
      const thunks = [
        loadProductReviews,
        loadReviews,
        addReview,
        updateReview,
        deleteReview,
      ];

      thunks.forEach((thunk) => {
        const state = reviewReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });
    });
  });

  describe("async thunks", () => {
    test("loadProductReviews stores reviews by productId", async () => {
      api.get.mockResolvedValueOnce([
        { _id: "rev-1", productId: "prod-1", rating: 5, comment: "Great" },
      ]);

      const dispatch = jest.fn();
      const result = await loadProductReviews("prod-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.get).toHaveBeenCalledWith("/reviews/product/prod-1");
      expect(result.type).toBe("reviews/loadProductReviews/fulfilled");
      expect(result.payload.productId).toBe("prod-1");
      expect(result.payload.reviews[0].id).toBe("rev-1");

      const state = reviewReducer(initialState, {
        type: loadProductReviews.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe("prod-1");
    });

    test("loadReviews loads all reviews", async () => {
      api.get
        .mockResolvedValueOnce({ items: [{ _id: "prod-2" }] })
        .mockResolvedValueOnce([{ _id: "rev-2", rating: 4 }]);

      const dispatch = jest.fn();
      const result = await loadReviews()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenNthCalledWith(1, "/products?limit=100");
      expect(api.get).toHaveBeenNthCalledWith(2, "/reviews/product/prod-2");
      expect(result.type).toBe("reviews/loadReviews/fulfilled");
      expect(result.payload[0].id).toBe("rev-2");

      const state = reviewReducer(initialState, {
        type: loadReviews.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("rev-2");
    });

    test("addReview posts a normalized review and updates the list", async () => {
      api.post.mockResolvedValueOnce({
        _id: "rev-3",
        productId: "prod-1",
        rating: 5,
        review: "Awesome",
        userId: "user-1",
      });

      const dispatch = jest.fn();
      const result = await addReview({
        productId: "prod-1",
        rating: 5,
        review: " Awesome ",
      })(dispatch, () => ({ auth: { user: { id: "user-1" } } }), undefined);

      expect(api.post).toHaveBeenCalledWith("/reviews/product/prod-1", {
        rating: 5,
        review: "Awesome",
      });
      expect(result.type).toBe("reviews/addReview/fulfilled");

      const existingState = {
        items: [],
        loading: false,
        error: null,
      };
      const state = reviewReducer(existingState, {
        type: addReview.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("rev-3");
    });

    test("loadProductReviews returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("network down"));

      const dispatch = jest.fn();
      const result = await loadProductReviews("prod-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("reviews/loadProductReviews/rejected");
      expect(result.payload).toBe("network down");

      const state = reviewReducer(initialState, {
        type: loadProductReviews.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("network down");
      expect(state.loading).toBe(false);
    });

    test("loadReviews returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("boom"));

      const dispatch = jest.fn();
      const result = await loadReviews()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("reviews/loadReviews/rejected");
      expect(result.payload).toBe("boom");

      const state = reviewReducer(initialState, {
        type: loadReviews.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("boom");
    });

    test("addReview returns rejected action on failure", async () => {
      api.post.mockRejectedValueOnce(new Error("cannot add"));

      const dispatch = jest.fn();
      const result = await addReview({
        productId: "prod-1",
        rating: 5,
        review: "Nice",
      })(dispatch, () => ({ auth: { user: null } }), undefined);

      expect(result.type).toBe("reviews/addReview/rejected");
      expect(result.payload).toBe("cannot add");

      const state = reviewReducer(initialState, {
        type: addReview.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot add");
    });

    test("updateReview edits an existing review", async () => {
      api.put.mockResolvedValueOnce({
        _id: "rev-1",
        productId: "prod-1",
        rating: 3,
      });

      const dispatch = jest.fn();
      const result = await updateReview({ id: "rev-1", data: { rating: 3 } })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.put).toHaveBeenCalledWith("/reviews/rev-1", { rating: 3 });
      expect(result.type).toBe("reviews/updateReview/fulfilled");

      const state = reviewReducer(
        { items: [{ id: "rev-1", rating: 5 }], loading: false, error: null },
        { type: updateReview.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].rating).toBe(3);
    });

    test("updateReview returns rejected action on failure", async () => {
      api.put.mockRejectedValueOnce(new Error("update failed"));

      const dispatch = jest.fn();
      const result = await updateReview({ id: "rev-1", data: {} })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("reviews/updateReview/rejected");

      const state = reviewReducer(initialState, {
        type: updateReview.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("update failed");
    });

    test("deleteReview removes a review from the list", async () => {
      api.delete.mockResolvedValueOnce({});

      const dispatch = jest.fn();
      const result = await deleteReview("rev-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.delete).toHaveBeenCalledWith("/reviews/rev-1");
      expect(result.type).toBe("reviews/deleteReview/fulfilled");

      const state = reviewReducer(
        {
          items: [{ id: "rev-1" }, { id: "rev-2" }],
          loading: false,
          error: null,
        },
        { type: deleteReview.fulfilled.type, payload: result.payload },
      );
      expect(state.items).toEqual([{ id: "rev-2" }]);
    });

    test("deleteReview returns rejected action on failure", async () => {
      api.delete.mockRejectedValueOnce(new Error("delete failed"));

      const dispatch = jest.fn();
      const result = await deleteReview("rev-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("reviews/deleteReview/rejected");

      const state = reviewReducer(initialState, {
        type: deleteReview.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("delete failed");
    });
  });
});
