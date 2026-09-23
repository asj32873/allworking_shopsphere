import issueReducer, {
  addIssueLocal,
  clearIssues,
  clearSelectedIssue,
  clearIssueError,
  loadIssues,
  loadUserIssues,
  loadIssue,
  addIssue,
  createIssue,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
} from "../../../src/store/slices/issueSlice";
import { api } from "../../../src/api/client";

jest.mock("../../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("issueSlice", () => {
  const initialState = {
    items: [],
    selectedIssue: null,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reducers", () => {
    test("clearIssues resets items and error", () => {
      const state = issueReducer(
        {
          items: [{ id: "i1" }],
          selectedIssue: null,
          loading: false,
          error: "err",
        },
        clearIssues(),
      );

      expect(state.items).toEqual([]);
      expect(state.error).toBeNull();
    });

    test("clearSelectedIssue sets selectedIssue to null", () => {
      const state = issueReducer(
        { ...initialState, selectedIssue: { id: "i1" } },
        clearSelectedIssue(),
      );

      expect(state.selectedIssue).toBeNull();
    });

    test("clearIssueError clears error", () => {
      const state = issueReducer(
        { ...initialState, error: "Error message" },
        clearIssueError(),
      );

      expect(state.error).toBeNull();
    });

    test("addIssueLocal unshifts a normalized issue", () => {
      const state = issueReducer(
        initialState,
        addIssueLocal({ _id: "local-1", subject: "Local issue" }),
      );

      expect(state.items[0].id).toBe("local-1");
    });

    test("addIssueLocal ignores a falsy payload", () => {
      const state = issueReducer(initialState, addIssueLocal(null));

      expect(state.items).toEqual([]);
    });
  });

  describe("async thunks", () => {
    test("loadIssues fetches issues and normalizes them", async () => {
      api.get.mockResolvedValueOnce([
        { _id: "issue-1", subject: "Refund request" },
      ]);

      const dispatch = jest.fn();
      const result = await loadIssues()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/issues");
      expect(result.type).toBe("issues/loadIssues/fulfilled");
      expect(result.payload[0].id).toBe("issue-1");

      const state = issueReducer(initialState, {
        type: loadIssues.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("issue-1");
    });

    test("loadIssues returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load"));

      const dispatch = jest.fn();
      const result = await loadIssues()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("issues/loadIssues/rejected");

      const state = issueReducer(initialState, {
        type: loadIssues.rejected.type,
        payload: result.payload,
      });
      expect(state.error).toBe("cannot load");
    });

    test("loadUserIssues fetches current user issues", async () => {
      api.get.mockResolvedValueOnce([
        { _id: "issue-2", subject: "Late delivery" },
      ]);

      const dispatch = jest.fn();
      const result = await loadUserIssues()(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/issues/my");
      expect(result.type).toBe("issues/loadUserIssues/fulfilled");
      expect(result.payload[0].id).toBe("issue-2");

      const state = issueReducer(initialState, {
        type: loadUserIssues.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("issue-2");
    });

    test("pending actions set loading and clear error for every issue thunk", () => {
      const thunks = [
        loadIssues,
        loadUserIssues,
        loadIssue,
        addIssue,
        createIssue,
        updateIssue,
        updateIssueStatus,
        deleteIssue,
      ];

      thunks.forEach((thunk) => {
        const state = issueReducer(
          { ...initialState, error: "stale error" },
          { type: thunk.pending.type },
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });
    });

    test("loadUserIssues returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("cannot load user issues"));

      const dispatch = jest.fn();
      const result = await loadUserIssues()(dispatch, () => ({}), undefined);

      expect(result.type).toBe("issues/loadUserIssues/rejected");
    });

    test("loadIssue fetches a single issue", async () => {
      api.get.mockResolvedValueOnce({ _id: "issue-3", subject: "Damaged" });

      const dispatch = jest.fn();
      const result = await loadIssue("issue-3")(dispatch, () => ({}), undefined);

      expect(api.get).toHaveBeenCalledWith("/issues/issue-3");
      expect(result.type).toBe("issues/loadIssue/fulfilled");

      const state = issueReducer(initialState, {
        type: loadIssue.fulfilled.type,
        payload: result.payload,
      });
      expect(state.selectedIssue.id).toBe("issue-3");
    });

    test("loadIssue returns rejected action on failure", async () => {
      api.get.mockRejectedValueOnce(new Error("not found"));

      const dispatch = jest.fn();
      const result = await loadIssue("missing")(dispatch, () => ({}), undefined);

      expect(result.type).toBe("issues/loadIssue/rejected");
    });

    test("addIssue creates an issue and prepends it to the list", async () => {
      api.post.mockResolvedValueOnce({ _id: "issue-4", subject: "New issue" });

      const dispatch = jest.fn();
      const result = await addIssue({ subject: "New issue" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.post).toHaveBeenCalledWith("/issues", { subject: "New issue" });
      expect(result.type).toBe("issues/addIssue/fulfilled");

      const state = issueReducer(initialState, {
        type: addIssue.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("issue-4");
    });

    test("addIssue returns rejected action on failure", async () => {
      api.post.mockRejectedValueOnce(new Error("cannot add"));

      const dispatch = jest.fn();
      const result = await addIssue({})(dispatch, () => ({}), undefined);

      expect(result.type).toBe("issues/addIssue/rejected");
    });

    test("createIssue creates an issue and prepends it to the list", async () => {
      api.post.mockResolvedValueOnce({ _id: "issue-5", subject: "Alias" });

      const dispatch = jest.fn();
      const result = await createIssue({ subject: "Alias" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("issues/createIssue/fulfilled");

      const state = issueReducer(initialState, {
        type: createIssue.fulfilled.type,
        payload: result.payload,
      });
      expect(state.items[0].id).toBe("issue-5");
    });

    test("createIssue returns rejected action on failure", async () => {
      api.post.mockRejectedValueOnce(new Error("cannot create"));

      const dispatch = jest.fn();
      const result = await createIssue({})(dispatch, () => ({}), undefined);

      expect(result.type).toBe("issues/createIssue/rejected");
    });

    test("updateIssue patches and merges an existing issue", async () => {
      api.patch.mockResolvedValueOnce({ _id: "issue-1", status: "RESOLVED" });

      const dispatch = jest.fn();
      const result = await updateIssue({ id: "issue-1", status: "RESOLVED" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.patch).toHaveBeenCalledWith("/issues/issue-1", {
        status: "RESOLVED",
      });
      expect(result.type).toBe("issues/updateIssue/fulfilled");

      const state = issueReducer(
        {
          items: [{ id: "issue-1", status: "OPEN" }],
          selectedIssue: { id: "issue-1", status: "OPEN" },
          loading: false,
          error: null,
        },
        { type: updateIssue.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].status).toBe("RESOLVED");
      expect(state.selectedIssue.status).toBe("RESOLVED");
    });

    test("updateIssue returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot update"));

      const dispatch = jest.fn();
      const result = await updateIssue({ id: "issue-1" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("issues/updateIssue/rejected");
    });

    test("updateIssueStatus patches status and merges the issue", async () => {
      api.patch.mockResolvedValueOnce({ _id: "issue-1", status: "CLOSED" });

      const dispatch = jest.fn();
      const result = await updateIssueStatus({ id: "issue-1", status: "CLOSED" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(api.patch).toHaveBeenCalledWith("/issues/issue-1/status", {
        status: "CLOSED",
      });
      expect(result.type).toBe("issues/updateIssueStatus/fulfilled");

      const state = issueReducer(
        {
          items: [{ id: "issue-1", status: "OPEN" }],
          selectedIssue: null,
          loading: false,
          error: null,
        },
        { type: updateIssueStatus.fulfilled.type, payload: result.payload },
      );
      expect(state.items[0].status).toBe("CLOSED");
    });

    test("updateIssueStatus returns rejected action on failure", async () => {
      api.patch.mockRejectedValueOnce(new Error("cannot update status"));

      const dispatch = jest.fn();
      const result = await updateIssueStatus({ id: "issue-1", status: "X" })(
        dispatch,
        () => ({}),
        undefined,
      );

      expect(result.type).toBe("issues/updateIssueStatus/rejected");
    });

    test("deleteIssue removes the issue and clears selection", async () => {
      api.delete.mockResolvedValueOnce({});

      const dispatch = jest.fn();
      const result = await deleteIssue("issue-1")(dispatch, () => ({}), undefined);

      expect(api.delete).toHaveBeenCalledWith("/issues/issue-1");
      expect(result.type).toBe("issues/deleteIssue/fulfilled");

      const state = issueReducer(
        {
          items: [{ id: "issue-1" }, { id: "issue-2" }],
          selectedIssue: { id: "issue-1" },
          loading: false,
          error: null,
        },
        { type: deleteIssue.fulfilled.type, payload: result.payload },
      );
      expect(state.items).toEqual([{ id: "issue-2" }]);
      expect(state.selectedIssue).toBeNull();
    });

    test("deleteIssue returns rejected action on failure", async () => {
      api.delete.mockRejectedValueOnce(new Error("cannot delete"));

      const dispatch = jest.fn();
      const result = await deleteIssue("issue-1")(dispatch, () => ({}), undefined);

      expect(result.type).toBe("issues/deleteIssue/rejected");
    });
  });
});
