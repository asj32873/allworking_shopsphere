import orderReducer, {
  clearOrders,
  loadUserOrders,
  loadVendorOrders,
  loadAdminOrders,
  loadOrder,
  placeOrder,
  updateVendorOrderStatus,
  updateAdminOrderStatus,
  createCheckoutSession,
} from "../../../src/store/slices/orderSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("orderSlice", () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
    currentOrder: null,
    detailsLoading: false,
    detailsError: null,
    checkoutLoading: false,
    checkoutError: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("clearOrders resets order lists and currentOrder", () => {
      const state = orderReducer(
        {
          items: [{ id: "o1" }],
          loading: false,
          error: "err",
          checkoutLoading: false,
          checkoutError: null,
        },
        clearOrders(),
      );

      expect(state.items).toEqual([]);
      expect(state.error).toBeNull();
    });

    test("pending actions set loading and clear error for every order thunk", () => {
      const thunks = [
        loadUserOrders,
        loadVendorOrders,
        loadAdminOrders,
        placeOrder,
      ];

      thunks.forEach((thunk) => {
        const state = orderReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      const checkoutState = orderReducer(
        { ...initialState, checkoutError: "stale error" },
        { type: createCheckoutSession.pending.type },
      );
      expect(checkoutState.checkoutLoading).toBe(true);
      expect(checkoutState.checkoutError).toBeNull();
    });
  });

  describe("async thunks", () => {
    test("loadUserOrders fetches and normalizes user orders", async () => {
      api.get.mockResolvedValueOnce([
        {
          _id: "order-101",
          items: [{ _id: "item-1", productId: { _id: "prod-1" } }],
        },
      ]);

      const dispatch = jest.fn();
      const result = await loadUserOrders()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/orders");
      expect(result.type).toBe("orders/loadUserOrders/fulfilled");
      expect(result.payload[0].id).toBe("order-101");
      expect(result.payload[0].items[0].id).toBe("item-1");

      const state = orderReducer(initialState, {
        type: loadUserOrders.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("order-101");
    });

    test("loadUserOrders returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load"));

      const dispatch = jest.fn();
      const result = await loadUserOrders()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("orders/loadUserOrders/rejected");

      const state = orderReducer(initialState, {
        type: loadUserOrders.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot load");
    });

    test("loadVendorOrders calls /orders/vendor/list", async () => {
      api.get.mockResolvedValueOnce([{ _id: "order-102" }]);

      const dispatch = jest.fn();
      const result = await loadVendorOrders()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/orders/vendor/list");
      expect(result.type).toBe("orders/loadVendorOrders/fulfilled");
      expect(result.payload[0].id).toBe("order-102");
    });

    test("loadVendorOrders returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load vendor orders"));

      const dispatch = jest.fn();
      const result = await loadVendorOrders()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("orders/loadVendorOrders/rejected");
    });

    test("loadAdminOrders calls /orders/admin/list", async () => {
      api.get.mockResolvedValueOnce([{ _id: "order-103" }]);

      const dispatch = jest.fn();
      const result = await loadAdminOrders()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/orders/admin/list");
      expect(result.type).toBe("orders/loadAdminOrders/fulfilled");
      expect(result.payload[0].id).toBe("order-103");
    });

    test("loadAdminOrders returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load admin orders"));

      const dispatch = jest.fn();
      const result = await loadAdminOrders()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("orders/loadAdminOrders/rejected");
    });

    test("loadOrder inserts a new order or replaces an existing one", async () => {
      api.get.mockResolvedValueOnce({ _id: "order-104" });

      const dispatch = jest.fn();
      const result = await loadOrder("order-104")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.get).toHaveBeenCalledWith("/orders/order-104");
      expect(result.type).toBe("orders/loadOrder/fulfilled");

      const insertedState = orderReducer(initialState, {
        type: loadOrder.fulfilled.type,
        payload: result.payload,
      });
      expect(insertedState.items[0].id).toBe("order-104");

      const replacedState = orderReducer(
        { ...initialState, items: [{ id: "order-104", status: "OLD" }] },
        {
          type: loadOrder.fulfilled.type,
          payload: { id: "order-104", status: "NEW" },
        },
      );
      expect(replacedState.items[0].status).toBe("NEW");
    });

    test("loadOrder returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("not found"));

      const dispatch = jest.fn();
      const result = await loadOrder("missing")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("orders/loadOrder/rejected");
    });

    test("placeOrder posts addressId and prepends the new order", async () => {
      api.post.mockResolvedValueOnce({ _id: "order-105" });

      const dispatch = jest.fn();
      const result = await placeOrder("addr-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.post).toHaveBeenCalledWith("/orders", { addressId: "addr-1" });
      expect(result.type).toBe("orders/placeOrder/fulfilled");

      const state = orderReducer(
        { ...initialState, items: [{ id: "order-99" }] },
        { type: placeOrder.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].id).toBe("order-105");
      expect(state.items).toHaveLength(2);
    });

    test("placeOrder returns rejected action on failure", async () => {
      api.post.mockRejectedValueOnce(new Error("cannot place order"));

      const dispatch = jest.fn();
      const result = await placeOrder("addr-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("orders/placeOrder/rejected");

      const state = orderReducer(initialState, {
        type: placeOrder.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot place order");
    });

    test("updateVendorOrderStatus updates the matching order item", async () => {
      api.patch.mockResolvedValueOnce({ vendorStatus: "PACKED" });

      const dispatch = jest.fn();
      const result = await updateVendorOrderStatus({
        orderId: "order-1",
        itemId: "item-1",
        status: "PACKED",
      })(dispatch, () => ({}), undefined);

      expect(api.patch).toHaveBeenCalledWith(
        "/orders/vendor/order-1/items/item-1/status",
        { status: "PACKED" },
      );
      expect(result.type).toBe("orders/updateVendorOrderStatus/fulfilled");

      const state = orderReducer(
        {
          ...initialState,
          items: [
            {
              id: "order-1",
              items: [{ id: "item-1", vendorStatus: "CONFIRMED" }],
            },
          ],
        },
        {
          type: updateVendorOrderStatus.fulfilled.type,
          payload: result.payload,
        },
      );
      expect(state.items[0].items[0].vendorStatus).toBe("PACKED");
    });

    test("updateVendorOrderStatus ignores unknown order or item", () => {
      const state = orderReducer(
        { ...initialState, items: [{ id: "order-1", items: [] }] },
        {
          type: updateVendorOrderStatus.fulfilled.type,
          payload: {
            orderId: "missing",
            itemId: "item-1",
            status: "X",
            data: {},
          },
        },
      );
      expect(state.items[0].items).toEqual([]);
    });

    test("updateVendorOrderStatus returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot update"));

      const dispatch = jest.fn();
      const result = await updateVendorOrderStatus({
        orderId: "order-1",
        itemId: "item-1",
        status: "X",
      })(dispatch, () => ({}), undefined);

      expect(result.type).toBe("orders/updateVendorOrderStatus/rejected");
    });

    test("updateAdminOrderStatus updates the matching order item", async () => {
      api.patch.mockResolvedValueOnce({ vendorStatus: "DELIVERED" });

      const dispatch = jest.fn();
      const result = await updateAdminOrderStatus({
        orderId: "order-1",
        itemId: "item-1",
        status: "DELIVERED",
      })(dispatch, () => ({}), undefined);

      expect(api.patch).toHaveBeenCalledWith(
        "/orders/admin/order-1/items/item-1/status",
        { status: "DELIVERED" },
      );
      expect(result.type).toBe("orders/updateAdminOrderStatus/fulfilled");

      const state = orderReducer(
        {
          ...initialState,
          items: [
            {
              id: "order-1",
              items: [{ id: "item-1", vendorStatus: "DISPATCHED" }],
            },
          ],
        },
        {
          type: updateAdminOrderStatus.fulfilled.type,
          payload: result.payload,
        },
      );
      expect(state.items[0].items[0].vendorStatus).toBe("DELIVERED");
    });

    test("updateAdminOrderStatus returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot update"));

      const dispatch = jest.fn();
      const result = await updateAdminOrderStatus({
        orderId: "order-1",
        itemId: "item-1",
        status: "X",
      })(dispatch, () => ({}), undefined);

      expect(result.type).toBe("orders/updateAdminOrderStatus/rejected");
    });

    test("createCheckoutSession posts addressId and handles response", async () => {
      api.post.mockResolvedValueOnce({
        sessionId: "sess_123",
        sessionUrl: "https://stripe.com/checkout",
      });

      const dispatch = jest.fn();
      const result = await createCheckoutSession("addr-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.post).toHaveBeenCalledWith(
        "/payments/create-checkout-session",
        {
          addressId: "addr-1",
        },
      );
      expect(result.type).toBe("orders/createCheckoutSession/fulfilled");
    });

    test("createCheckoutSession returns rejected action on failure", async () => {
      api.post.mockRejectedValueOnce(new Error("cannot start payment"));

      const dispatch = jest.fn();
      const result = await createCheckoutSession("addr-1")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("orders/createCheckoutSession/rejected");

      const state = orderReducer(initialState, {
        type: createCheckoutSession.rejected.type,
        payload: result.payload,
      });
      expect(state.checkoutError).toBe("cannot start payment");
      expect(state.checkoutLoading).toBe(false);
    });
  });
});
