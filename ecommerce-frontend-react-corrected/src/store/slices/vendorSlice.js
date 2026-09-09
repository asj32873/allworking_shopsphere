import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../api/client";

/*
 * =========================================================
 * NORMALIZE VENDOR
 * =========================================================
 */

const normalizeVendor = (vendor) => {
  if (!vendor) return null;

  return {
    ...vendor,

    id: vendor._id || vendor.id,

    userId: vendor.userId?._id || vendor.userId?.id || vendor.userId || null,
  };
};

/*
 * =========================================================
 * LOAD CURRENT VENDOR PROFILE
 * =========================================================
 */

export const loadVendorProfile = createAsyncThunk(
  "vendors/loadVendorProfile",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/vendors/profile");

      return normalizeVendor(data?.data || data?.vendor || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load vendor profile");
    }
  },
);

/*
 * =========================================================
 * LOAD ADMIN VENDORS
 * =========================================================
 */

export const loadAdminVendors = createAsyncThunk(
  "vendors/loadAdminVendors",
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get("/admin/vendors");

      const vendors = Array.isArray(data)
        ? data
        : data?.data || data?.vendors || data?.items || [];

      return vendors.map(normalizeVendor);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load vendors");
    }
  },
);

/*
 * =========================================================
 * CREATE VENDOR PROFILE
 * =========================================================
 */

export const createVendorProfile = createAsyncThunk(
  "vendors/createVendorProfile",
  async (vendorData, { rejectWithValue }) => {
    try {
      const data = await api.post("/vendors", vendorData);

      return normalizeVendor(data?.data || data?.vendor || data);
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to create vendor profile",
      );
    }
  },
);

/*
 * =========================================================
 * UPDATE VENDOR PROFILE
 * =========================================================
 */

export const updateVendorProfile = createAsyncThunk(
  "vendors/updateVendorProfile",
  async (vendorData, { rejectWithValue }) => {
    try {
      const data = await api.patch("/vendors/profile", vendorData);

      return normalizeVendor(data?.data || data?.vendor || data);
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to update vendor profile",
      );
    }
  },
);

/*
 * =========================================================
 * APPROVE VENDOR
 * THIS FIXES YOUR CURRENT ERROR
 * =========================================================
 */

export const approveVendor = createAsyncThunk(
  "vendors/approveVendor",
  async (vendorId, { rejectWithValue }) => {
    try {
      const data = await api.patch(`/admin/vendors/${vendorId}/approve`);

      return normalizeVendor(data?.data || data?.vendor || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to approve vendor");
    }
  },
);

/*
 * =========================================================
 * REJECT VENDOR
 * =========================================================
 */

export const rejectVendor = createAsyncThunk(
  "vendors/rejectVendor",
  async (vendorId, { rejectWithValue }) => {
    try {
      const data = await api.patch(`/admin/vendors/${vendorId}/reject`);

      return normalizeVendor(data?.data || data?.vendor || data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to reject vendor");
    }
  },
);

/*
 * =========================================================
 * UPDATE VENDOR STATUS
 * =========================================================
 */

export const updateVendorStatus = createAsyncThunk(
  "vendors/updateVendorStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await api.patch(`/admin/vendors/${id}/status`, { status });

      return normalizeVendor(data?.data || data?.vendor || data);
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to update vendor status",
      );
    }
  },
);

/*
 * =========================================================
 * DELETE VENDOR
 * =========================================================
 */

export const deleteVendor = createAsyncThunk(
  "vendors/deleteVendor",
  async (vendorId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/vendors/${vendorId}`);

      return vendorId;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to delete vendor");
    }
  },
);

/*
 * =========================================================
 * INITIAL STATE
 * =========================================================
 */

const initialState = {
  profile: null,

  items: [],

  loading: false,

  profileLoading: false,

  error: null,
};

/*
 * =========================================================
 * VENDOR SLICE
 * =========================================================
 */

const vendorSlice = createSlice({
  name: "vendors",

  initialState,

  reducers: {
    clearVendorProfile: (state) => {
      state.profile = null;
      state.profileLoading = false;
    },

    clearVendors: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },

    clearVendorState: (state) => {
      state.profile = null;
      state.items = [];
      state.loading = false;
      state.profileLoading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /*
     * LOAD VENDOR PROFILE
     */

    builder
      .addCase(loadVendorProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(loadVendorProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(loadVendorProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      });

    /*
     * LOAD ADMIN VENDORS
     */

    builder
      .addCase(loadAdminVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAdminVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadAdminVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * CREATE VENDOR PROFILE
     */

    builder
      .addCase(createVendorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVendorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;

        const exists = state.items.some(
          (vendor) => String(vendor.id) === String(action.payload.id),
        );

        if (!exists) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createVendorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * UPDATE VENDOR PROFILE
     */

    builder
      .addCase(updateVendorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;

        const index = state.items.findIndex(
          (vendor) => String(vendor.id) === String(action.payload.id),
        );

        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...action.payload,
          };
        }
      })
      .addCase(updateVendorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * APPROVE VENDOR
     */

    builder
      .addCase(approveVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveVendor.fulfilled, (state, action) => {
        state.loading = false;

        const updatedVendor = action.payload;

        const index = state.items.findIndex(
          (vendor) => String(vendor.id) === String(updatedVendor.id),
        );

        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...updatedVendor,
            status: updatedVendor.status || "approved",
          };
        }

        if (
          state.profile &&
          String(state.profile.id) === String(updatedVendor.id)
        ) {
          state.profile = {
            ...state.profile,
            ...updatedVendor,
          };
        }
      })
      .addCase(approveVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * REJECT VENDOR
     */

    builder
      .addCase(rejectVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectVendor.fulfilled, (state, action) => {
        state.loading = false;

        const updatedVendor = action.payload;

        const index = state.items.findIndex(
          (vendor) => String(vendor.id) === String(updatedVendor.id),
        );

        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...updatedVendor,
            status: updatedVendor.status || "rejected",
          };
        }
      })
      .addCase(rejectVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * UPDATE VENDOR STATUS
     */

    builder
      .addCase(updateVendorStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendorStatus.fulfilled, (state, action) => {
        state.loading = false;

        const updatedVendor = action.payload;

        const index = state.items.findIndex(
          (vendor) => String(vendor.id) === String(updatedVendor.id),
        );

        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...updatedVendor,
          };
        }
      })
      .addCase(updateVendorStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /*
     * DELETE VENDOR
     */

    builder
      .addCase(deleteVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.loading = false;

        state.items = state.items.filter(
          (vendor) => String(vendor.id) !== String(action.payload),
        );

        if (
          state.profile &&
          String(state.profile.id) === String(action.payload)
        ) {
          state.profile = null;
        }
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/*
 * =========================================================
 * EXPORT ACTIONS
 * =========================================================
 */

export const { clearVendorProfile, clearVendors, clearVendorState } =
  vendorSlice.actions;

/*
 * =========================================================
 * EXPORT REDUCER
 * =========================================================
 */

export default vendorSlice.reducer;
