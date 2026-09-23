import { store } from "../../src/store/store";
import { logout } from "../../src/store/slices/authSlice";
import { clearCart } from "../../src/store/slices/cartSlice";

describe("Redux store configuration", () => {
  test("initializes with all expected reducers", () => {
    const state = store.getState();

    expect(state).toHaveProperty("auth");
    expect(state).toHaveProperty("products");
    expect(state).toHaveProperty("cart");
    expect(state).toHaveProperty("orders");
    expect(state).toHaveProperty("addresses");
    expect(state).toHaveProperty("issues");
    expect(state).toHaveProperty("reviews");
    expect(state).toHaveProperty("vendors");
    expect(state).toHaveProperty("users");
  });

  test("dispatches actions and updates store state", () => {
    store.dispatch(logout());
    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.user).toBeNull();

    store.dispatch(clearCart());
    expect(store.getState().cart.items).toEqual([]);
    expect(store.getState().cart.total).toBe(0);
  });
});
