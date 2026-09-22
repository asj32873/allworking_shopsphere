import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import {
  approveVendor,
  rejectVendor,
  deleteVendor,
} from "../../store/slices/vendorSlice";

const statusLabels = {
  APPLIED: "Pending Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default function AdminVendors() {
  const dispatch = useDispatch();

  const vendors = useSelector((state) => state.vendors.items);

  const pendingCount = vendors.filter(
    (v) => v.status === "APPLIED",
  ).length;

  return (
    <PortalLayout type="admin">
      <div className="admin-vendors-page">
        <header className="admin-vendors-header">
          <div>
            <div className="admin-vendors-eyebrow">
              VENDOR MANAGEMENT
            </div>

            <h1 className="admin-vendors-title">
              Vendor Management
            </h1>

            <p className="admin-vendors-subtitle">
              Review vendor applications and manage verified vendor accounts.
            </p>
          </div>

          <div className="admin-vendors-summary">
            <span className="admin-vendors-summary-value">
              {pendingCount}
            </span>

            <span className="admin-vendors-summary-label">
              Pending Review
            </span>
          </div>
        </header>

        <section className="admin-vendors-card">
          <div className="admin-vendors-card-header">
            <div>
              <div className="admin-vendors-card-eyebrow">
                ALL VENDORS
              </div>

              <h2 className="admin-vendors-card-title">
                Vendor Accounts
              </h2>
            </div>

            <div className="admin-vendors-count">
              {vendors.length}{" "}
              {vendors.length === 1 ? "vendor" : "vendors"}
            </div>
          </div>

          {vendors.length > 0 ? (
            <div className="admin-vendors-table-wrap">
              <table className="admin-vendors-table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div className="admin-vendor-store">
                          <div className="admin-vendor-store-icon">
                            <i className="bi bi-shop" />
                          </div>

                          <div>
                            <div className="admin-vendor-store-name">
                              {v.storeName}
                            </div>

                            <div className="admin-vendor-store-id">
                              Vendor #{v.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="admin-vendor-email">
                          <i className="bi bi-envelope" />
                          {v.email}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-vendor-status admin-vendor-status-${String(
                            v.status,
                          ).toLowerCase()}`}
                        >
                          <span className="admin-vendor-status-dot" />
                          {statusLabels[v.status] || v.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-vendor-actions">
                          {v.status === "APPLIED" && (
                            <>
                              <button
                                className="admin-vendor-approve"
                                onClick={() =>
                                  dispatch(approveVendor(v.id))
                                }
                              >
                                <i className="bi bi-check-lg" />
                                Approve
                              </button>

                              <button
                                className="admin-vendor-reject"
                                onClick={() =>
                                  dispatch(rejectVendor(v.id))
                                }
                              >
                                <i className="bi bi-x-lg" />
                                Reject
                              </button>
                            </>
                          )}

                          {v.status === "VERIFIED" && (
                            <button
                              className="admin-vendor-delete"
                              onClick={() =>
                                dispatch(deleteVendor(v.id))
                              }
                            >
                              <i className="bi bi-trash3" />
                              Delete
                            </button>
                          )}

                          {v.status !== "APPLIED" &&
                            v.status !== "VERIFIED" && (
                              <span className="admin-vendor-no-action">
                                No actions
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-vendors-empty">
              <div className="admin-vendors-empty-icon">
                <i className="bi bi-shop" />
              </div>

              <div className="admin-vendors-empty-eyebrow">
                NO VENDORS
              </div>

              <h3>No vendor accounts</h3>

              <p>
                Vendor applications and verified accounts will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </PortalLayout>
  );
}