import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { addIssue } from "../store/slices/issueSlice";

export default function Issues() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const issues = useSelector((state) => state.issues.items);
  const orders = useSelector((state) => state.orders.items);

  const [s, setS] = useState("");
  const [d, setD] = useState("");
  const [o, setO] = useState("");
  const [p, setP] = useState("MEDIUM");

  const submit = async (e) => {
    e.preventDefault();

    if (!s || !d) return;

    try {
      await dispatch(
        addIssue({
          subject: s,
          description: d,
          orderId: o || undefined,
          priority: p,
        }),
      ).unwrap();

      setS("");
      setD("");
      setO("");
    } catch (error) {
      alert(error || "Failed to submit issue.");
    }
  };

  const userId = user?._id || user?.id;

  const myOrders = orders.filter(
    (x) => String(x.userId) === String(userId),
  );

  const myIssues = issues.filter(
    (i) => String(i.userId) === String(userId),
  );

  return (
    <div className="issues-page">
      <div className="container">
        <header className="issues-header">
          <div>
            <div className="issues-eyebrow">CUSTOMER SUPPORT</div>

            <h1 className="issues-title">Customer Issues</h1>

            <p className="issues-subtitle">
              Report an issue with an order or contact ShopSphere
              support.
            </p>
          </div>

          <div className="issues-count">
            {myIssues.length}{" "}
            {myIssues.length === 1 ? "issue" : "issues"}
          </div>
        </header>

        <div className="issues-layout">
          {/* CREATE ISSUE */}
          <section className="issue-create-card">
            <div className="issue-card-header">
              <div className="issue-card-icon">
                <i className="bi bi-headset" />
              </div>

              <div>
                <div className="issue-card-eyebrow">
                  NEED HELP?
                </div>

                <h2 className="issue-card-title">
                  Submit an Issue
                </h2>
              </div>
            </div>

            <p className="issue-card-description">
              Tell us what went wrong and our support team can
              review your request.
            </p>

            <form onSubmit={submit} className="issue-form">
              <div className="issue-field">
                <label htmlFor="issue-subject">
                  Subject
                </label>

                <input
                  id="issue-subject"
                  className="issue-input"
                  placeholder="What do you need help with?"
                  value={s}
                  onChange={(e) => setS(e.target.value)}
                />
              </div>

              <div className="issue-field">
                <label htmlFor="issue-description">
                  Description
                </label>

                <textarea
                  id="issue-description"
                  className="issue-textarea"
                  placeholder="Describe the issue in detail..."
                  value={d}
                  onChange={(e) => setD(e.target.value)}
                  rows="5"
                />
              </div>

              <div className="issue-field">
                <label htmlFor="issue-order">
                  Related Order
                </label>

                <select
                  id="issue-order"
                  className="issue-select"
                  value={o}
                  onChange={(e) => setO(e.target.value)}
                >
                  <option value="">
                    No specific order
                  </option>

                  {myOrders.map((x) => {
                    const orderId = x.id || x._id;

                    return (
                      <option key={orderId} value={orderId}>
                        #{orderId}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="issue-field">
                <label htmlFor="issue-priority">
                  Priority
                </label>

                <select
                  id="issue-priority"
                  className="issue-select"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <button
                type="submit"
                className="issue-submit-button"
              >
                Submit Issue
                <i className="bi bi-arrow-right" />
              </button>
            </form>
          </section>

          {/* ISSUE HISTORY */}
          <section className="issues-history">
            <div className="issues-history-header">
              <div>
                <div className="issues-history-eyebrow">
                  SUPPORT HISTORY
                </div>

                <h2>My Issues</h2>
              </div>

              <span>{myIssues.length}</span>
            </div>

            {myIssues.length === 0 && (
              <div className="issues-empty">
                <div className="issues-empty-icon">
                  <i className="bi bi-chat-square-text" />
                </div>

                <h3>No issues submitted</h3>

                <p>
                  Your support requests will appear here after
                  you submit one.
                </p>
              </div>
            )}

            {myIssues.map((i) => (
              <article
                className="issue-history-card"
                key={i.id || i._id}
              >
                <div className="issue-history-top">
                  <div className="issue-history-identity">
                    <div className="issue-history-icon">
                      <i className="bi bi-ticket-perforated" />
                    </div>

                    <div>
                      <div className="issue-history-label">
                        ISSUE #{i.id || i._id}
                      </div>

                      <h3>{i.subject}</h3>
                    </div>
                  </div>

                  <span className="issue-status-badge">
                    <span className="issue-status-dot" />
                    {i.status}
                  </span>
                </div>

                <div className="issue-history-divider" />

                <p className="issue-history-description">
                  {i.description}
                </p>

                {i.response && (
                  <div className="issue-response">
                    <div className="issue-response-header">
                      <i className="bi bi-reply" />
                      Support Response
                    </div>

                    <p>{i.response}</p>
                  </div>
                )}
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}