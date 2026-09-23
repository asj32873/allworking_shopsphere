import cartReducer, {
  setCart,
  clearCart,
  loadCart,
  addToCart,
  removeFromCart,
  updateCartQty,
} from "../../../src/store/slices/cartSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("cartSlice", () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
    total: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("clearCart resets items and total to 0", () => {
      const populatedState = {
        items: [{ id: "c1", productId: "p1", quantity: 2, price: 100 }],
        loading: false,
        error: "error",
        total: 200,
      };

      const state = cartReducer(populatedState, clearCart());

      expect(state.items).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.error).toBeNull();
    });

    test("setCart replaces items and recalculates the total", () => {
      const state = cartReducer(
        initialState,
        setCart([
          { id: "c1", subtotal: 100 },
          { id: "c2", subtotal: 50 },
        ]),
      );

      expect(state.items).toHaveLength(2);
      expect(state.total).toBe(150);
    });

    test("setCart defaults to an empty array when payload is falsy", () => {
      const state = cartReducer(initialState, setCart(undefined));

      expect(state.items).toEqual([]);
      expect(state.total).toBe(0);
    });

    test("pending actions set loading and clear error for every cart thunk", () => {
      const thunks = [loadCart, addToCart, removeFromCart, updateCartQty];

      thunks.forEach((thunk) => {
        const state = cartReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });
    });

    test("loadCart.rejected resets items and total", () => {
      const state = cartReducer(
        { items: [{ id: "c1" }], total: 100, loading: true, error: null },
        { type: loadCart.rejected.type, payload: "cannot load" },
      );

      expect(state.items).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.error).toBe("cannot load");
    });
  });

  describe("async thunks", () => {
    describe("loadCart", () => {
      test("returns empty array when user is not a USER role", async () => {
        const getState = () => ({ auth: { user: { role: "VENDOR" } } });
        const dispatch = jest.fn();

        const result = await loadCart()(dispatch, getState, undefined);

        expect(result.type).toBe("cart/loadCart/fulfilled");
        expect(result.payload).toEqual([]);
        expect(api.get).not.toHaveBeenCalled();
      });

      test("loads and normalizes cart items when user is USER", async () => {
        const getState = () => ({ auth: { user: { role: "USER" } } });
        const dispatch = jest.fn();
        api.get.mockResolvedValueOnce([
          {
            _id: "cart-1",
            productId: { _id: "prod-1", name: "Shirt", price: 500 },
            quantity: 2,
            price: 500,
          },
        ]);

        const result = await loadCart()(dispatch, getState, undefined);

        expect(result.type).toBe("cart/loadCart/fulfilled");
        expect(result.payload).toHaveLength(1);
        expect(result.payload[0].id).toBe("cart-1");
        expect(result.payload[0].productId).toBe("prod-1");
      });

      test("calculates total in loadCart.fulfilled reducer", () => {
        const payload = [
          { id: "1", quantity: 2, price: 100, subtotal: 200 },
          { id: "2", quantity: 3, product: { price: 50 }, subtotal: 150 },
        ];

        const state = cartReducer(initialState, {
          type: loadCart.fulfilled.type,
          payload,
        });

        expect(state.items).toEqual(payload);
        expect(state.total).toBe(2 * 100 + 3 * 50);
        expect(state.loading).toBe(false);
      });
    });

    describe("addToCart", () => {
      test("rejects if user is not logged in as USER", async () => {
        const getState = () => ({ auth: { user: null } });
        const dispatch = jest.fn();

        const result = await addToCart({ product: { id: "p1", stock: 5 } })(
          dispatch,
          getState,
          undefined,
        );

        expect(result.type).toBe("cart/addToCart/rejected");
        expect(result.payload).toBe("Please login as a user first.");
      });

      test("rejects if product is out of stock", async () => {
        const getState = () => ({ auth: { user: { role: "USER" } } });
        const dispatch = jest.fn();

        const result = await addToCart({ product: { id: "p1", stock: 0 } })(
          dispatch,
          getState,
          undefined,
        );

        expect(result.type).toBe("cart/addToCart/rejected");
        expect(result.payload).toBe("Product is out of stock.");
      });

      test("calls api.post and reloads cart on success", async () => {
        const getState = () => ({ auth: { user: { role: "USER" } } });
        const dispatch = jest.fn().mockReturnValue({
          unwrap: jest.fn().mockResolvedValue([]),
        });
        api.post.mockResolvedValueOnce({ success: true });

        const result = await addToCart({
          product: { _id: "p1", stock: 5 },
          quantity: 2,
        })(dispatch, getState, undefined);

        expect(api.post).toHaveBeenCalledWith("/cart/items", {
          productId: "p1",
          quantity: 2,
        });
        expect(result.type).toBe("cart/addToCart/fulfilled");
      });
    });

    describe("removeFromCart", () => {
      test("rejects if item not in cart", async () => {
        const getState = () => ({ cart: { items: [] } });
        const dispatch = jest.fn();

        const result = await removeFromCart("p-nonexistent")(
          dispatch,
          getState,
          undefined,
        );

        expect(result.type).toBe("cart/removeFromCart/rejected");
        expect(result.payload).toBe("Cart item not found.");
      });

      test("calls api.delete with item id and reloads cart", async () => {
        const getState = () => ({
          cart: {
            items: [{ id: "cart-item-1", productId: "prod-10" }],
          },
        });
        const dispatch = jest.fn().mockReturnValue({
          unwrap: jest.fn().mockResolvedValue([]),
        });
        api.delete.mockResolvedValueOnce({ success: true });

        const result = await removeFromCart("prod-10")(
          dispatch,
          getState,
          undefined,
        );

        expect(api.delete).toHaveBeenCalledWith("/cart/items/cart-item-1");
        expect(result.type).toBe("cart/removeFromCart/fulfilled");
      });
    });

    describe("updateCartQty", () => {
      test("calls api.patch when quantity > 0", async () => {
        const getState = () => ({
          cart: {
            items: [{ id: "cart-item-2", productId: "prod-20" }],
          },
        });
        const dispatch = jest.fn().mockReturnValue({
          unwrap: jest.fn().mockResolvedValue([]),
        });
        api.patch.mockResolvedValueOnce({ success: true });

        const result = await updateCartQty({ id: "prod-20", quantity: 3 })(
          dispatch,
          getState,
          undefined,
        );

        expect(api.patch).toHaveBeenCalledWith("/cart/items/cart-item-2", {
          quantity: 3,
        });
        expect(result.type).toBe("cart/updateCartQty/fulfilled");
      });

      test("calls api.delete when quantity <= 0", async () => {
        const getState = () => ({
          cart: {
            items: [{ id: "cart-item-2", productId: "prod-20" }],
          },
        });
        const dispatch = jest.fn().mockReturnValue({
          unwrap: jest.fn().mockResolvedValue([]),
        });
        api.delete.mockResolvedValueOnce({ success: true });

        const result = await updateCartQty({ id: "prod-20", quantity: 0 })(
          dispatch,
          getState,
          undefined,
        );

        expect(api.delete).toHaveBeenCalledWith("/cart/items/cart-item-2");
        expect(result.type).toBe("cart/updateCartQty/fulfilled");
      });

      test("rejects if item not in cart", async () => {
        const getState = () => ({ cart: { items: [] } });
        const dispatch = jest.fn();

        const result = await updateCartQty({ id: "prod-missing", quantity: 1 })(
          dispatch,
          getState,
          undefined,
        );

        expect(result.type).toBe("cart/updateCartQty/rejected");
        expect(result.payload).toBe("Cart item not found.");
      });
    });
  });
});
