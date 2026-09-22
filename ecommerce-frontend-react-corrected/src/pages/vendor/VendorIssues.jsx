import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { updateIssue } from "../../store/slices/issueSlice";

const statusLabels = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export default function VendorIssues() {
  const dispatch = useDispatch();

  const issues = useSelector((state) => state.issues.items);

  const orders = useSelector((state) => state.orders.items);

  const user = useSelector((state) => state.auth.user);

  const mine = issues.filter(
    (i) =>
      String(i.vendorId) === String(user?.id) ||
      orders
        .find((o) => String(o.id) === String(i.orderId))
        ?.items?.some(
          (x) => String(x.vendorId) === String(user?.id),
        ),
  );

  const openIssues = mine.filter((i) => i.status !== "RESOLVED").length;

  return (
    <PortalLayout type="vendor">
      <div className="vendor-issues-page">
        <header className="vendor-issues-header">
          <div>
            <div className="vendor-issues-eyebrow">
              CUSTOMER SUPPORT
            </div>

            <h1 className="vendor-issues-title">
              Customer Issues
            </h1>

            <p className="vendor-issues-subtitle">
              Review customer concerns and manage their resolution status.
            </p>
          </div>

          <div className="vendor-issues-summary">
            <span className="vendor-issues-summary-value">
              {openIssues}
            </span>

            <span className="vendor-issues-summary-label">
              Open Issues
            </span>
          </div>
        </header>

        {mine.length > 0 ? (
          <div className="vendor-issues-list">
            {mine.map((i) => {
              const isResolved = i.status === "RESOLVED";
              const isInProgress = i.status === "IN_PROGRESS";

              return (
                <article className="vendor-issue-card" key={i.id}>
                  <div className="vendor-issue-card-top">
                    <div className="vendor-issue-identity">
                      <div className="vendor-issue-icon">
                        <i className="bi bi-chat-left-text" />
                      </div>

                      <div>
                        <div className="vendor-issue-eyebrow">
                          CUSTOMER ISSUE
                        </div>

                        <h2 className="vendor-issue-title">
                          #{i.id} — {i.subject}
                        </h2>
                      </div>
                    </div>

                    <span
                      className={`vendor-issue-status vendor-issue-status-${String(
                        i.status,
                      ).toLowerCase()}`}
                    >
                      <span className="vendor-issue-status-dot" />
                      {statusLabels[i.status] || i.status}
                    </span>
                  </div>

                  <div className="vendor-issue-divider" />

                  <div className="vendor-issue-description">
                    <div className="vendor-issue-description-label">
                      CUSTOMER MESSAGE
                    </div>

                    <p>{i.description}</p>
                  </div>

                  {i.response && (
                    <div className="vendor-issue-response">
                      <div className="vendor-issue-response-icon">
                        <i className="bi bi-reply" />
                      </div>

                      <div>
                        <div className="vendor-issue-response-label">
                          VENDOR RESPONSE
                        </div>

                        <p>{i.response}</p>
                      </div>
                    </div>
                  )}

                  <div className="vendor-issue-actions">
                    <div className="vendor-issue-action-context">
                      {isResolved
                        ? "This issue has been resolved."
                        : isInProgress
                          ? "This issue is currently being handled."
                          : "Choose an action to update this issue."}
                    </div>

                    <div className="vendor-issue-action-buttons">
                      <button
                        className="vendor-issue-progress-button"
                        disabled={isResolved || isInProgress}
                        onClick={() =>
                          dispatch(
                            updateIssue({
                              id: i.id,
                              data: {
                                status: "IN_PROGRESS",
                              },
                            }),
                          )
                        }
                      >
                        <i className="bi bi-arrow-right-circle" />
                        In Progress
                      </button>

                      <button
                        className="vendor-issue-resolve-button"
                        disabled={isResolved}
                        onClick={() =>
                          dispatch(
                            updateIssue({
                              id: i.id,
                              data: {
                                status: "RESOLVED",
                                response: "Resolved by vendor.",
                              },
                            }),
                          )
                        }
                      >
                        <i className="bi bi-check2-circle" />
                        {isResolved ? "Resolved" : "Resolve"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="vendor-issues-empty">
            <div className="vendor-issues-empty-icon">
              <i className="bi bi-chat-left-check" />
            </div>

            <div className="vendor-issues-empty-eyebrow">
              ALL CLEAR
            </div>

            <h2>No customer issues</h2>

            <p>
              Customer issues related to your products will appear here.
            </p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}