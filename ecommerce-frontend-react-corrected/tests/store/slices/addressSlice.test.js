import addressReducer, {
  setAddresses,
  clearAddresses,
  loadAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../../src/store/slices/addressSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("addressSlice", () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("clearAddresses resets state", () => {
      const state = addressReducer(
        { items: [{ id: "a1" }], loading: false, error: "err" },
        clearAddresses(),
      );

      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    test("setAddresses replaces the address list", () => {
      const state = addressReducer(initialState, setAddresses([{ id: "a9" }]));

      expect(state.items).toEqual([{ id: "a9" }]);
    });

    test("pending actions set loading and clear error for every address thunk", () => {
      const thunks = [
        loadAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
      ];

      thunks.forEach((thunk) => {
        const state = addressReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });
    });
  });

  describe("async thunks", () => {
    test("loadAddresses returns normalized addresses", async () => {
      api.get.mockResolvedValueOnce([{ _id: "addr-1", street: "Park Ave" }]);

      const dispatch = jest.fn();
      const result = await loadAddresses()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/addresses");
      expect(result.type).toBe("addresses/loadAddresses/fulfilled");
      expect(result.payload[0].id).toBe("addr-1");
    });

    test("addAddress posts address and adds to state", async () => {
      const newAddr = { street: "10th Main", city: "Bengaluru" };
      api.post.mockResolvedValueOnce({ _id: "addr-2", ...newAddr });

      const dispatch = jest.fn();
      const result = await addAddress(newAddr)(dispatch, () => ({}), undefined);

      expect(api.post).toHaveBeenCalledWith("/addresses", newAddr);
      expect(result.type).toBe("addresses/addAddress/fulfilled");

      const state = addressReducer(initialState, {
        type: addAddress.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("addr-2");
    });

    test("updateAddress updates existing address in state", async () => {
      const updated = { _id: "addr-2", street: "11th Main" };
      api.put.mockResolvedValueOnce(updated);

      const dispatch = jest.fn();
      const result = await updateAddress({
        id: "addr-2",
        data: { street: "11th Main" },
      })(dispatch, () => ({}), undefined);

      expect(api.put).toHaveBeenCalledWith("/addresses/addr-2", {
        street: "11th Main",
      });
      expect(result.type).toBe("addresses/updateAddress/fulfilled");

      const existingState = {
        items: [{ id: "addr-2", street: "10th Main" }],
        loading: false,
        error: null,
      };
      const state = addressReducer(existingState, {
        type: updateAddress.fulfilled.type,
        payload: { id: "addr-2", street: "11th Main" },
      });
      expect(state.items[0].street).toBe("11th Main");
    });

    test("deleteAddress removes address from state", async () => {
      api.delete.mockResolvedValueOnce({ success: true });

      const dispatch = jest.fn();
      const result = await deleteAddress("addr-2")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.delete).toHaveBeenCalledWith("/addresses/addr-2");
      expect(result.type).toBe("addresses/deleteAddress/fulfilled");
      expect(result.payload).toBe("addr-2");

      const existingState = {
        items: [{ id: "addr-2" }, { id: "addr-3" }],
        loading: false,
        error: null,
      };
      const state = addressReducer(existingState, {
        type: deleteAddress.fulfilled.type,
        payload: "addr-2",
      });
      expect(state.items).toEqual([{ id: "addr-3" }]);
    });

    test("setDefaultAddress marks chosen address as default and others as not default", async () => {
      api.patch.mockResolvedValueOnce({ _id: "addr-3", isDefault: true });

      const dispatch = jest.fn();
      const result = await setDefaultAddress("addr-3")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.patch).toHaveBeenCalledWith("/addresses/addr-3/default", {});
      expect(result.type).toBe("addresses/setDefaultAddress/fulfilled");

      const existingState = {
        items: [
          { id: "addr-2", isDefault: true },
          { id: "addr-3", isDefault: false },
        ],
        loading: false,
        error: null,
      };
      const state = addressReducer(existingState, {
        type: setDefaultAddress.fulfilled.type,
        payload: { id: "addr-3", isDefault: true },
      });
      expect(state.items.find((a) => a.id === "addr-3").isDefault).toBe(true);
      expect(state.items.find((a) => a.id === "addr-2").isDefault).toBe(false);
    });

    test("loadAddresses returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load"));

      const dispatch = jest.fn();
      const result = await loadAddresses()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("addresses/loadAddresses/rejected");

      const state = addressReducer(initialState, {
        type: loadAddresses.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot load");
    });

    test("addAddress returns rejected action on failure", async () => {
      api.post.mockRejectedValueOnce(new Error("cannot add"));

      const dispatch = jest.fn();
      const result = await addAddress({})(dispatch, () => ({}), undefined);

      expect(result.type).toBe("addresses/addAddress/rejected");

      const state = addressReducer(initialState, {
        type: addAddress.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot add");
    });

    test("updateAddress returns rejected action on failure", async () => {
      api.put.mockRejectedValueOnce(new Error("cannot update"));

      const dispatch = jest.fn();
      const result = await updateAddress({ id: "addr-2", data: {} })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("addresses/updateAddress/rejected");
    });

    test("deleteAddress returns rejected action on failure", async () => {
      api.delete.mockRejectedValueOnce(new Error("cannot delete"));

      const dispatch = jest.fn();
      const result = await deleteAddress("addr-2")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("addresses/deleteAddress/rejected");
    });

    test("setDefaultAddress returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot set default"));

      const dispatch = jest.fn();
      const result = await setDefaultAddress("addr-3")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("addresses/setDefaultAddress/rejected");
    });
  });
});
