import { useDispatch, useSelector } from "react-redux";
import PortalLayout from "../../components/common/PortalLayout";

import { updateIssue } from "../../store/slices/issueSlice";

export default function AdminIssues() {
  const dispatch = useDispatch();

  const issues = useSelector((state) => state.issues.items);

  const vendors = useSelector((state) => state.vendors.items);

  return (
    <PortalLayout type="admin">
      <div className="admin-issues-page">
        <div className="admin-issues-header">
          <div>
            <div className="admin-issues-eyebrow">SUPPORT MANAGEMENT</div>

            <h1 className="admin-issues-title">Issue Management</h1>

            <p className="admin-issues-subtitle">
              Review customer issues, assign them to verified vendors, and
              manage their resolution status.
            </p>
          </div>

          <div className="admin-issues-summary">
            <div className="admin-issues-summary-item">
              <span className="admin-issues-summary-value">
                {issues.length}
              </span>
              <span className="admin-issues-summary-label">Total Issues</span>
            </div>

            <div className="admin-issues-summary-divider" />

            <div className="admin-issues-summary-item">
              <span className="admin-issues-summary-value">
                {
                  issues.filter(
                    (i) => !["RESOLVED", "CLOSED"].includes(i.status),
                  ).length
                }
              </span>
              <span className="admin-issues-summary-label">Open</span>
            </div>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="admin-issues-empty">
            <div className="admin-issues-empty-icon">
              <i className="bi bi-life-preserver" />
            </div>

            <div className="admin-issues-empty-eyebrow">NO ISSUES</div>

            <h3>No issues require attention</h3>

            <p>
              Customer support issues will appear here when they are
              submitted.
            </p>
          </div>
        ) : (
          <div className="admin-issues-list">
            {issues.map((i) => (
              <div className="admin-issue-card" key={i._id || i.id}>
                <div className="admin-issue-card-header">
                  <div className="admin-issue-identity">
                    <div className="admin-issue-icon">
                      <i className="bi bi-exclamation-circle" />
                    </div>

                    <div>
                      <div className="admin-issue-eyebrow">
                        SUPPORT ISSUE
                      </div>

                      <h2 className="admin-issue-title">
                        #{i._id || i.id}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`admin-issue-status admin-issue-status-${String(
                      i.status || "OPEN",
                    ).toLowerCase()}`}
                  >
                    <span className="admin-issue-status-dot" />
                    {i.status}
                  </span>
                </div>

                <div className="admin-issue-divider" />

                <div className="admin-issue-main">
                  <div className="admin-issue-details">
                    <div className="admin-issue-subject">
                      {i.subject}
                    </div>

                    <p className="admin-issue-description">
                      {i.description}
                    </p>

                    <div className="admin-issue-meta">
                      <span>
                        <i className="bi bi-flag" />
                        Priority: <strong>{i.priority}</strong>
                      </span>

                      <span>
                        <i className="bi bi-receipt" />
                        Order: <strong>{i.orderId || "N/A"}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="admin-issue-controls">
                    <div className="admin-issue-control">
                      <label htmlFor={`vendor-${i._id || i.id}`}>
                        Assign Vendor
                      </label>

                      <select
                        id={`vendor-${i._id || i.id}`}
                        className="admin-issue-select"
                        value={i.assignedTo || ""}
                        onChange={(e) =>
                          dispatch(
                            updateIssue({
                              id: i._id || i.id,
                              data: {
                                assignedTo: e.target.value || null,
                              },
                            }),
                          )
                        }
                      >
                        <option value="">Unassigned</option>

                        {vendors
                          .filter((v) => v.status === "VERIFIED")
                          .map((v) => (
                            <option
                              key={v._id || v.id}
                              value={v.userId}
                            >
                              {v.storeName}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="admin-issue-control">
                      <label htmlFor={`status-${i._id || i.id}`}>
                        Issue Status
                      </label>

                      <select
                        id={`status-${i._id || i.id}`}
                        className="admin-issue-select"
                        value={i.status}
                        onChange={(e) =>
                          dispatch(
                            updateIssue({
                              id: i._id || i.id,
                              data: {
                                status: e.target.value,
                              },
                            }),
                          )
                        }
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}