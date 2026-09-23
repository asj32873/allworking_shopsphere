import productReducer, {
  setProducts,
  clearProducts,
  loadProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../../../src/store/slices/productSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("productSlice", () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("setProducts updates items array", () => {
      const products = [{ id: "p1", name: "Headphones" }];
      const state = productReducer(initialState, setProducts(products));

      expect(state.items).toEqual(products);
    });

    test("clearProducts resets items, loading and error", () => {
      const dirtyState = {
        items: [{ id: "p1" }],
        loading: true,
        error: "Some error",
      };
      const state = productReducer(dirtyState, clearProducts());

      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    test("pending actions set loading and clear error for every product thunk", () => {
      const thunks = [loadProducts, addProduct, updateProduct, deleteProduct];

      thunks.forEach((thunk) => {
        const state = productReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });
    });
  });

  describe("async thunks", () => {
    describe("loadProducts", () => {
      test("loads products and handles normalization", async () => {
        api.get.mockResolvedValueOnce([
          { _id: "p1", name: "Product 1", imageUrl: "http://img.com/1" },
        ]);

        const dispatch = jest.fn();
        const result = await loadProducts()(dispatch, () => ({}), undefined);

        expect(api.get).toHaveBeenCalledWith("/products?limit=100");
        expect(result.type).toBe("products/loadProducts/fulfilled");
        expect(result.payload[0].id).toBe("p1");
        expect(result.payload[0].image).toBe("http://img.com/1");
      });

      test("handles loadProducts error", async () => {
        api.get.mockRejectedValueOnce(new Error("Network timeout"));

        const dispatch = jest.fn();
        const result = await loadProducts()(dispatch, () => ({}), undefined);

        expect(result.type).toBe("products/loadProducts/rejected");
        expect(result.payload).toBe("Network timeout");
      });
    });

    describe("addProduct", () => {
      test("posts new product and unshifts to items", async () => {
        const newProd = {
          name: "Sneakers",
          price: 2000,
          image: "http://img.com/2",
        };
        api.post.mockResolvedValueOnce({ _id: "p2", ...newProd });

        const dispatch = jest.fn();
        const result = await addProduct(newProd)(
          dispatch,
          () => ({}),
          undefined,
        );

        expect(api.post).toHaveBeenCalledWith("/products", {
          ...newProd,
          imageUrl: "http://img.com/2",
        });
        expect(result.type).toBe("products/addProduct/fulfilled");

        const state = productReducer(initialState, {
          type: addProduct.fulfilled.type,
          payload: result.payload,
        });
        expect(state.items[0].id).toBe("p2");
      });

      test("handles addProduct error", async () => {
        api.post.mockRejectedValueOnce(new Error("cannot add"));

        const dispatch = jest.fn();
        const result = await addProduct({})(dispatch, () => ({}), undefined);

        expect(result.type).toBe("products/addProduct/rejected");
        expect(result.payload).toBe("cannot add");
      });
    });

    describe("updateProduct", () => {
      test("puts updated product and updates items", async () => {
        const updateData = { name: "Updated Sneakers", price: 2500 };
        api.put.mockResolvedValueOnce({ _id: "p2", ...updateData });

        const dispatch = jest.fn();
        const result = await updateProduct({ id: "p2", data: updateData })(
          dispatch,
          () => ({}),
          undefined,
        );

        expect(api.put).toHaveBeenCalledWith("/products/p2", {
          ...updateData,
          imageUrl: "",
        });
        expect(result.type).toBe("products/updateProduct/fulfilled");

        const existingState = {
          items: [{ id: "p2", name: "Sneakers", price: 2000 }],
          loading: false,
          error: null,
        };
        const state = productReducer(existingState, {
          type: updateProduct.fulfilled.type,
          payload: result.payload,
        });
        expect(state.items[0].price).toBe(2500);
      });

      test("handles updateProduct error", async () => {
        api.put.mockRejectedValueOnce(new Error("cannot update"));

        const dispatch = jest.fn();
        const result = await updateProduct({ id: "p2", data: {} })(
          dispatch,
          () => ({}),
          undefined,
        );

        expect(result.type).toBe("products/updateProduct/rejected");
        expect(result.payload).toBe("cannot update");
      });
    });

    describe("deleteProduct", () => {
      test("deletes product and filters from state", async () => {
        api.delete.mockResolvedValueOnce({ success: true });

        const dispatch = jest.fn();
        const result = await deleteProduct("p2")(
          dispatch,
          () => ({}),
          undefined,
        );

        expect(api.delete).toHaveBeenCalledWith("/products/p2");
        expect(result.type).toBe("products/deleteProduct/fulfilled");
        expect(result.payload).toBe("p2");

        const existingState = {
          items: [{ id: "p2" }, { id: "p3" }],
          loading: false,
          error: null,
        };
        const state = productReducer(existingState, {
          type: deleteProduct.fulfilled.type,
          payload: "p2",
        });
        expect(state.items).toEqual([{ id: "p3" }]);
      });

      test("handles deleteProduct error", async () => {
        api.delete.mockRejectedValueOnce(new Error("cannot delete"));

        const dispatch = jest.fn();
        const result = await deleteProduct("p2")(
          dispatch,
          () => ({}),
          undefined,
        );

        expect(result.type).toBe("products/deleteProduct/rejected");
        expect(result.payload).toBe("cannot delete");
      });
    });
  });
});
