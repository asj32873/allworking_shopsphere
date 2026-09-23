import vendorReducer, {
  clearVendorProfile,
  clearVendors,
  clearVendorState,
  loadVendorProfile,
  loadAdminVendors,
  createVendorProfile,
  updateVendorProfile,
  approveVendor,
  rejectVendor,
  updateVendorStatus,
  deleteVendor,
} from "../../../src/store/slices/vendorSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("vendorSlice", () => {
  const initialState = {
    profile: null,
    items: [],
    loading: false,
    profileLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("clearVendors resets state", () => {
      const state = vendorReducer(
        {
          profile: { id: "v1" },
          items: [{ id: "v1" }],
          loading: false,
          profileLoading: false,
          error: "err",
        },
        clearVendors(),
      );

      expect(state.items).toEqual([]);
      expect(state.profile).toEqual({ id: "v1" });
      expect(state.error).toBeNull();
    });

    test("clearVendorProfile resets profile only", () => {
      const state = vendorReducer(
        { ...initialState, profile: { id: "v1" }, profileLoading: true },
        clearVendorProfile(),
      );

      expect(state.profile).toBeNull();
      expect(state.profileLoading).toBe(false);
    });

    test("clearVendorState resets everything", () => {
      const state = vendorReducer(
        {
          profile: { id: "v1" },
          items: [{ id: "v1" }],
          loading: true,
          profileLoading: true,
          error: "err",
        },
        clearVendorState(),
      );

      expect(state).toEqual(initialState);
    });

    test("pending actions set loading and clear error for every vendor thunk", () => {
      const loadingThunks = [
        loadAdminVendors,
        createVendorProfile,
        updateVendorProfile,
        approveVendor,
        rejectVendor,
        updateVendorStatus,
        deleteVendor,
      ];

      loadingThunks.forEach((thunk) => {
        const state = vendorReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      const profileState = vendorReducer(
        { ...initialState, error: "stale error" },
        { type: loadVendorProfile.pending.type },
      );
      expect(profileState.profileLoading).toBe(true);
      expect(profileState.error).toBeNull();
    });
  });

  describe("async thunks", () => {
    test("loadVendorProfile fetches vendor profile", async () => {
      api.get.mockResolvedValueOnce({
        _id: "vend-1",
        storeName: "Fashion Hub",
      });

      const dispatch = jest.fn();
      const result = await loadVendorProfile()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/vendors/profile");
      expect(result.type).toBe("vendors/loadVendorProfile/fulfilled");
      expect(result.payload.id).toBe("vend-1");

      const state = vendorReducer(initialState, {
        type: loadVendorProfile.fulfilled.type,
        payload: result.payload,
      });
      expect(state.profile.id).toBe("vend-1");
    });

    test("loadVendorProfile returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load profile"));

      const dispatch = jest.fn();
      const result = await loadVendorProfile()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("vendors/loadVendorProfile/rejected");

      const state = vendorReducer(initialState, {
        type: loadVendorProfile.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot load profile");
    });

    test("loadAdminVendors fetches all vendors for admin", async () => {
      api.get.mockResolvedValueOnce([
        { _id: "vend-2", storeName: "Electronics Hub" },
      ]);

      const dispatch = jest.fn();
      const result = await loadAdminVendors()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/admin/vendors");
      expect(result.type).toBe("vendors/loadAdminVendors/fulfilled");
      expect(result.payload[0].id).toBe("vend-2");

      const state = vendorReducer(initialState, {
        type: loadAdminVendors.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("vend-2");
    });

    test("loadAdminVendors returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load vendors"));

      const dispatch = jest.fn();
      const result = await loadAdminVendors()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("vendors/loadAdminVendors/rejected");
    });

    test("createVendorProfile creates and stores a new profile", async () => {
      api.post.mockResolvedValueOnce({ _id: "vend-3", storeName: "New Shop" });

      const dispatch = jest.fn();
      const result = await createVendorProfile({ storeName: "New Shop" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.post).toHaveBeenCalledWith("/vendors", {
        storeName: "New Shop",
      });
      expect(result.type).toBe("vendors/createVendorProfile/fulfilled");

      const state = vendorReducer(initialState, {
        type: createVendorProfile.fulfilled.type,
        payload: result.payload,
      });
      expect(state.profile.id).toBe("vend-3");
      expect(state.items[0].id).toBe("vend-3");
    });

    test("createVendorProfile does not duplicate an existing vendor", async () => {
      const payload = { id: "vend-3", storeName: "New Shop" };

      const state = vendorReducer(
        { ...initialState, items: [{ id: "vend-3" }] },
        { type: createVendorProfile.fulfilled.type, payload },
      );
      expect(state.items).toHaveLength(1);
    });

    test("createVendorProfile returns rejected action on failure", async () => {
      api.post.mockRejectedValueOnce(new Error("cannot create"));

      const dispatch = jest.fn();
      const result = await createVendorProfile({})(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("vendors/createVendorProfile/rejected");
    });

    test("updateVendorProfile updates the profile and matching list entry", async () => {
      api.patch.mockResolvedValueOnce({ _id: "vend-3", storeName: "Updated" });

      const dispatch = jest.fn();
      const result = await updateVendorProfile({ storeName: "Updated" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.patch).toHaveBeenCalledWith("/vendors/profile", {
        storeName: "Updated",
      });
      expect(result.type).toBe("vendors/updateVendorProfile/fulfilled");

      const state = vendorReducer(
        { ...initialState, items: [{ id: "vend-3", storeName: "Old" }] },
        { type: updateVendorProfile.fulfilled.type, payload: result.payload },
      );
      expect(state.profile.storeName).toBe("Updated");
      expect(state.items[0].storeName).toBe("Updated");
    });

    test("updateVendorProfile returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot update"));

      const dispatch = jest.fn();
      const result = await updateVendorProfile({})(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("vendors/updateVendorProfile/rejected");
    });

    test("approveVendor updates the vendor's status in the list and profile", async () => {
      api.patch.mockResolvedValueOnce({ _id: "vend-4", status: "approved" });

      const dispatch = jest.fn();
      const result = await approveVendor("vend-4")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.patch).toHaveBeenCalledWith("/admin/vendors/vend-4/approve");
      expect(result.type).toBe("vendors/approveVendor/fulfilled");

      const state = vendorReducer(
        {
          ...initialState,
          items: [{ id: "vend-4", status: "pending" }],
          profile: { id: "vend-4", status: "pending" },
        },
        { type: approveVendor.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].status).toBe("approved");
      expect(state.profile.status).toBe("approved");
    });

    test("approveVendor defaults status to approved when missing", () => {
      const state = vendorReducer(
        { ...initialState, items: [{ id: "vend-4", status: "pending" }] },
        {
          type: approveVendor.fulfilled.type,
          payload: { id: "vend-4" },
        },
      );
      expect(state.items[0].status).toBe("approved");
    });

    test("approveVendor returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot approve"));

      const dispatch = jest.fn();
      const result = await approveVendor("vend-4")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("vendors/approveVendor/rejected");
    });

    test("rejectVendor updates the vendor's status in the list", async () => {
      api.patch.mockResolvedValueOnce({ _id: "vend-5", status: "rejected" });

      const dispatch = jest.fn();
      const result = await rejectVendor("vend-5")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.patch).toHaveBeenCalledWith("/admin/vendors/vend-5/reject");
      expect(result.type).toBe("vendors/rejectVendor/fulfilled");

      const state = vendorReducer(
        { ...initialState, items: [{ id: "vend-5", status: "pending" }] },
        { type: rejectVendor.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].status).toBe("rejected");
    });

    test("rejectVendor defaults status to rejected when missing", () => {
      const state = vendorReducer(
        { ...initialState, items: [{ id: "vend-5", status: "pending" }] },
        { type: rejectVendor.fulfilled.type, payload: { id: "vend-5" } },
      );
      expect(state.items[0].status).toBe("rejected");
    });

    test("rejectVendor returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot reject"));

      const dispatch = jest.fn();
      const result = await rejectVendor("vend-5")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("vendors/rejectVendor/rejected");
    });

    test("updateVendorStatus patches vendor status", async () => {
      api.patch.mockResolvedValueOnce({
        _id: "vend-2",
        status: "APPROVED",
      });

      const dispatch = jest.fn();
      const result = await updateVendorStatus({
        id: "vend-2",
        status: "APPROVED",
      })(dispatch, () => ({}), undefined);

      expect(api.patch).toHaveBeenCalledWith("/admin/vendors/vend-2/status", {
        status: "APPROVED",
      });
      expect(result.type).toBe("vendors/updateVendorStatus/fulfilled");

      const state = vendorReducer(
        { ...initialState, items: [{ id: "vend-2", status: "PENDING" }] },
        { type: updateVendorStatus.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].status).toBe("APPROVED");
    });

    test("updateVendorStatus returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot update status"));

      const dispatch = jest.fn();
      const result = await updateVendorStatus({ id: "vend-2", status: "X" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("vendors/updateVendorStatus/rejected");
    });

    test("deleteVendor removes the vendor and clears matching profile", async () => {
      api.delete.mockResolvedValueOnce({});

      const dispatch = jest.fn();
      const result = await deleteVendor("vend-2")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.delete).toHaveBeenCalledWith("/admin/vendors/vend-2");
      expect(result.type).toBe("vendors/deleteVendor/fulfilled");

      const state = vendorReducer(
        {
          ...initialState,
          items: [{ id: "vend-2" }, { id: "vend-3" }],
          profile: { id: "vend-2" },
        },
        { type: deleteVendor.fulfilled.type, payload: result.payload },
      );
      expect(state.items).toEqual([{ id: "vend-3" }]);
      expect(state.profile).toBeNull();
    });

    test("deleteVendor returns rejected action on failure", async () => {
      api.delete.mockRejectedValueOnce(new Error("cannot delete"));

      const dispatch = jest.fn();
      const result = await deleteVendor("vend-2")(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("vendors/deleteVendor/rejected");
    });
  });
});
