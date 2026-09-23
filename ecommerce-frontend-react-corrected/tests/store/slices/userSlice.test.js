import userReducer, {
  clearUsers,
  loadAdminUsers,
  updateUserStatus,
  deleteUser,
} from "../../../src/store/slices/userSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("userSlice", () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("clearUsers resets user slice", () => {
      const state = userReducer(
        { items: [{ id: "u1" }], loading: false, error: "err" },
        clearUsers(),
      );

      expect(state.items).toEqual([]);
      expect(state.error).toBeNull();
    });

    test("pending actions set loading and clear error for every user thunk", () => {
      const thunks = [loadAdminUsers, updateUserStatus, deleteUser];

      thunks.forEach((thunk) => {
        const state = userReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });
    });
  });

  describe("async thunks", () => {
    test("loadAdminUsers fetches and normalizes users", async () => {
      api.get.mockResolvedValueOnce([{ _id: "u-10", name: "User 10" }]);

      const dispatch = jest.fn();
      const result = await loadAdminUsers()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/admin/users");
      expect(result.type).toBe("users/loadAdminUsers/fulfilled");
      expect(result.payload[0].id).toBe("u-10");

      const state = userReducer(initialState, {
        type: loadAdminUsers.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("u-10");
    });

    test("loadAdminUsers returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load users"));

      const dispatch = jest.fn();
      const result = await loadAdminUsers()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("users/loadAdminUsers/rejected");

      const state = userReducer(initialState, {
        type: loadAdminUsers.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot load users");
    });

    test("updateUserStatus updates user in state", async () => {
      api.patch.mockResolvedValueOnce({ _id: "u-10", status: "SUSPENDED" });

      const dispatch = jest.fn();
      const result = await updateUserStatus({
        id: "u-10",
        status: "SUSPENDED",
      })(dispatch, () => ({}), undefined);

      expect(api.patch).toHaveBeenCalledWith("/admin/users/u-10/status", {
        status: "SUSPENDED",
      });
      expect(result.type).toBe("users/updateUserStatus/fulfilled");

      const state = userReducer(
        { ...initialState, items: [{ id: "u-10", status: "ACTIVE" }] },
        { type: updateUserStatus.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].status).toBe("SUSPENDED");
    });

    test("updateUserStatus returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot update status"));

      const dispatch = jest.fn();
      const result = await updateUserStatus({ id: "u-10", status: "X" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("users/updateUserStatus/rejected");
    });

    test("deleteUser removes the user from state", async () => {
      api.delete.mockResolvedValueOnce({});

      const dispatch = jest.fn();
      const result = await deleteUser("u-10")(dispatch, () => ({}), undefined);

      expect(api.delete).toHaveBeenCalledWith("/admin/users/u-10");
      expect(result.type).toBe("users/deleteUser/fulfilled");

      const state = userReducer(
        { ...initialState, items: [{ id: "u-10" }, { id: "u-11" }] },
        { type: deleteUser.fulfilled.type, payload: result.payload },
      );
      expect(state.items).toEqual([{ id: "u-11" }]);
    });

    test("deleteUser returns rejected action on failure", async () => {
      api.delete.mockRejectedValueOnce(new Error("cannot delete"));

      const dispatch = jest.fn();
      const result = await deleteUser("u-10")(dispatch, () => ({}), undefined);

      expect(result.type).toBe("users/deleteUser/rejected");
    });
  });
});
