import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../api/client";

/*
 * =========================================================
 * NORMALIZE ISSUE
 * =========================================================
 */

const normalizeIssue = (issue) => {
  if (!issue) return null;

  return {
    ...issue,

    id: issue._id || issue.id,

    userId: issue.userId?._id || issue.userId?.id || issue.userId || null,

    vendorId:
      issue.vendorId?._id || issue.vendorId?.id || issue.vendorId || null,

    orderId: issue.orderId?._id || issue.orderId?.id || issue.orderId || null,
  };
};

/*
 * =========================================================
 * LOAD ALL ISSUES
 * =========================================================
 */

export const loadIssues = createAsyncThunk(
  "issues/loadIssues",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/issues");

      const issues = Array.isArray(data)
        ? data
        : data?.data || data?.issues || data?.items || [];

      return issues.map(normalizeIssue);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load issues");
    }
  },
);

/*
 * =========================================================
 * LOAD USER ISSUES
 * =========================================================
 */

export const loadUserIssues = createAsyncThunk(
  "issues/loadUserIssues",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/issues/my");

      const issues = Array.isArray(data)
        ? data
        : data?.data || data?.issues || data?.items || [];

      return issues.map(normalizeIssue);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load user issues");
    }
  },
);

/*
 * =========================================================
 * LOAD SINGLE ISSUE
 * =========================================================
 */

export const loadIssue = createAsyncThunk(
  "issues/loadIssue",
  async (issueId, { rejectWithValue }) => {
    try {
      const data = await api.get(`/issues/${issueId}`);

      return normalizeIssue(data?.data || data?.issue || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load issue");
    }
  },
);

/*
 * =========================================================
 * ADD ISSUE
 *
 * This fixes:
 * does not provide an export named 'addIssue'
 * =========================================================
 */

export const addIssue = createAsyncThunk(
  "issues/addIssue",
  async (issueData, { rejectWithValue }) => {
    try {
      const data = await api.post("/issues", issueData);

      return normalizeIssue(data?.data || data?.issue || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to add issue");
    }
  },
);

/*
 * =========================================================
 * CREATE ISSUE
 *
 * Alias-style separate thunk for components that use
 * createIssue instead of addIssue.
 * =========================================================
 */

export const createIssue = createAsyncThunk(
  "issues/createIssue",
  async (issueData, { rejectWithValue }) => {
    try {
      const data = await api.post("/issues", issueData);

      return normalizeIssue(data?.data || data?.issue || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to create issue");
    }
  },
);

/*
 * =========================================================
 * UPDATE ISSUE
 * =========================================================
 */

export const updateIssue = createAsyncThunk(
  "issues/updateIssue",
  async ({ id, ...issueData }, { rejectWithValue }) => {
    try {
      const data = await api.patch(`/issues/${id}`, issueData);

      return normalizeIssue(data?.data || data?.issue || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to update issue");
    }
  },
);

/*
 * =========================================================
 * UPDATE ISSUE STATUS
 * =========================================================
 */

export const updateIssueStatus = createAsyncThunk(
  "issues/updateIssueStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await api.patch(`/issues/${id}/status`, { status });

      return normalizeIssue(data?.data || data?.issue || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to update issue status");
    }
  },
);

/*
 * =========================================================
 * DELETE ISSUE
 * =========================================================
 */

export const deleteIssue = createAsyncThunk(
  "issues/deleteIssue",
  async (issueId, { rejectWithValue }) => {
    try {
      await api.delete(`/issues/${issueId}`);

      return issueId;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to delete issue");
    }
  },
);

/*
 * =========================================================
 * INITIAL STATE
 * =========================================================
 */

const initialState = {
  items: [],
  selectedIssue: null,

  loading: false,
  error: null,
};

/*
 * =========================================================
 * ISSUE SLICE
 * =========================================================
 */

const issueSlice = createSlice({
  name: "issues",

  initialState,

  reducers: {
    /*
     * Optional synchronous local add.
     */

    addIssueLocal: (state, action) => {
      const issue = normalizeIssue(action.payload);

      if (issue) {
        state.items.unshift(issue);
      }
    },

    clearIssues: (state) => {
      state.items = [];
      state.selectedIssue = null;
      state.loading = false;
      state.error = null;
    },

    clearSelectedIssue: (state) => {
      state.selectedIssue = null;
    },

    clearIssueError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /*
     * =====================================================
     * LOAD ALL ISSUES
     * =====================================================
     */

    builder
      .addCase(loadIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * =====================================================
     * LOAD USER ISSUES
     * =====================================================
     */

    builder
      .addCase(loadUserIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadUserIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * =====================================================
     * LOAD SINGLE ISSUE
     * =====================================================
     */

    builder
      .addCase(loadIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadIssue.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIssue = action.payload;
      })
      .addCase(loadIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * =====================================================
     * ADD ISSUE
     * =====================================================
     */

    builder
      .addCase(addIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addIssue.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(addIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * =====================================================
     * CREATE ISSUE
     * =====================================================
     */

    builder
      .addCase(createIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * =====================================================
     * UPDATE ISSUE
     * =====================================================
     */

    builder
      .addCase(updateIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIssue.fulfilled, (state, action) => {
        state.loading = false;

        const updatedIssue = action.payload;

        if (!updatedIssue) return;

        const index = state.items.findIndex(
          (issue) => String(issue.id) === String(updatedIssue.id),
        );

        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...updatedIssue,
          };
        }

        if (
          state.selectedIssue &&
          String(state.selectedIssue.id) === String(updatedIssue.id)
        ) {
          state.selectedIssue = {
            ...state.selectedIssue,
            ...updatedIssue,
          };
        }
      })
      .addCase(updateIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * =====================================================
     * UPDATE ISSUE STATUS
     * =====================================================
     */

    builder
      .addCase(updateIssueStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIssueStatus.fulfilled, (state, action) => {
        state.loading = false;

        const updatedIssue = action.payload;

        if (!updatedIssue) return;

        const index = state.items.findIndex(
          (issue) => String(issue.id) === String(updatedIssue.id),
        );

        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...updatedIssue,
          };
        }

        if (
          state.selectedIssue &&
          String(state.selectedIssue.id) === String(updatedIssue.id)
        ) {
          state.selectedIssue = {
            ...state.selectedIssue,
            ...updatedIssue,
          };
        }
      })
      .addCase(updateIssueStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * =====================================================
     * DELETE ISSUE
     * =====================================================
     */

    builder
      .addCase(deleteIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteIssue.fulfilled, (state, action) => {
        state.loading = false;

        const deletedId = action.payload;

        state.items = state.items.filter(
          (issue) => String(issue.id) !== String(deletedId),
        );

        if (
          state.selectedIssue &&
          String(state.selectedIssue.id) === String(deletedId)
        ) {
          state.selectedIssue = null;
        }
      })
      .addCase(deleteIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/*
 * =========================================================
 * EXPORT SYNCHRONOUS ACTIONS
 * =========================================================
 */

export const {
  addIssueLocal,
  clearIssues,
  clearSelectedIssue,
  clearIssueError,
} = issueSlice.actions;

/*
 * =========================================================
 * EXPORT REDUCER
 * =========================================================
 */

export default issueSlice.reducer;
