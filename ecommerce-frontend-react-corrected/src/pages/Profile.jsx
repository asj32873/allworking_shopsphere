import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Profile() {
  const user = useSelector((state) => state.auth.user);

  const addresses = useSelector((state) => state.addresses.items);
  const orders = useSelector((state) => state.orders.items);
  const reviews = useSelector((state) => state.reviews.items);
  const issues = useSelector((state) => state.issues.items);

  const mineAddresses = addresses.filter(
    (a) => !a.userId || String(a.userId) === String(user?.id),
  );

  const mineOrders = orders.filter(
    (o) => !o.userId || String(o.userId) === String(user?.id),
  );

  const mineReviews = reviews.filter(
    (r) => String(r.userId) === String(user?.id),
  );

  const mineIssues = issues.filter(
    (i) => !i.userId || String(i.userId) === String(user?.id),
  );

  return (
    <div className="profile-page">
      <div className="container">
        <header className="profile-header">
          <div>
            <div className="profile-eyebrow">ACCOUNT</div>

            <h1 className="profile-title">My Profile</h1>

            <p className="profile-subtitle">
              Manage your account, addresses, orders, and support activity.
            </p>
          </div>
        </header>

        <div className="profile-layout">
          {/* USER CARD */}
          <aside className="profile-user-card">
            <div className="profile-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <h2 className="profile-user-name">
              {user?.name || "User"}
            </h2>

            <p className="profile-user-email">
              {user?.email}
            </p>

            <span className="profile-role-badge">
              <i className="bi bi-person-check" />
              {user?.role}
            </span>

            <div className="profile-user-divider" />

            <div className="profile-user-info">
              <span>Account</span>
              <strong>ShopSphere Customer</strong>
            </div>
          </aside>

          <main className="profile-content">
            {/* ADDRESSES */}
            <section className="profile-section-card">
              <div className="profile-section-header">
                <div className="profile-section-heading">
                  <div className="profile-section-icon">
                    <i className="bi bi-geo-alt" />
                  </div>

                  <div>
                    <div className="profile-section-eyebrow">
                      DELIVERY
                    </div>

                    <h2>Addresses</h2>
                  </div>
                </div>

                <Link
                  to="/profile/addresses"
                  className="profile-manage-link"
                >
                  Manage
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>

              {mineAddresses.length === 0 ? (
                <div className="profile-address-empty">
                  <i className="bi bi-geo-alt" />

                  <span>
                    No saved addresses yet.
                  </span>

                  <Link to="/profile/addresses">
                    Add an address
                  </Link>
                </div>
              ) : (
                <div className="profile-address-list">
                  {mineAddresses.map((a) => (
                    <div
                      className="profile-address-item"
                      key={a.id || a._id}
                    >
                      <div className="profile-address-item-icon">
                        <i
                          className={
                            a.type === "Office"
                              ? "bi bi-building"
                              : "bi bi-house"
                          }
                        />
                      </div>

                      <div className="profile-address-content">
                        <div className="profile-address-top">
                          <strong>{a.type}</strong>

                          {a.isDefault && (
                            <span className="profile-default-badge">
                              Default
                            </span>
                          )}
                        </div>

                        <p>
                          {a.addressLine}, {a.city} - {a.pincode}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ACTIVITY */}
            <section className="profile-section-card">
              <div className="profile-section-header">
                <div className="profile-section-heading">
                  <div className="profile-section-icon">
                    <i className="bi bi-bar-chart" />
                  </div>

                  <div>
                    <div className="profile-section-eyebrow">
                      ACTIVITY
                    </div>

                    <h2>Account Overview</h2>
                  </div>
                </div>
              </div>

              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-icon profile-stat-icon-orders">
                    <i className="bi bi-bag" />
                  </div>

                  <div>
                    <strong>{mineOrders.length}</strong>
                    <span>Orders</span>
                  </div>
                </div>

                <div className="profile-stat">
                  <div className="profile-stat-icon profile-stat-icon-reviews">
                    <i className="bi bi-star" />
                  </div>

                  <div>
                    <strong>{mineReviews.length}</strong>
                    <span>Reviews</span>
                  </div>
                </div>

                <div className="profile-stat">
                  <div className="profile-stat-icon profile-stat-icon-issues">
                    <i className="bi bi-headset" />
                  </div>

                  <div>
                    <strong>{mineIssues.length}</strong>
                    <span>Issues</span>
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK LINKS */}
            <section className="profile-section-card profile-quick-actions">
              <div className="profile-section-header">
                <div className="profile-section-heading">
                  <div className="profile-section-icon">
                    <i className="bi bi-grid" />
                  </div>

                  <div>
                    <div className="profile-section-eyebrow">
                      QUICK ACCESS
                    </div>

                    <h2>Account Links</h2>
                  </div>
                </div>
              </div>

              <div className="profile-action-grid">
                <Link
                  to="/profile/reviews"
                  className="profile-action-link"
                >
                  <span>
                    <i className="bi bi-star" />
                  </span>

                  <div>
                    <strong>My Reviews</strong>
                    <small>
                      View your product reviews
                    </small>
                  </div>

                  <i className="bi bi-arrow-right" />
                </Link>

                <Link
                  to="/profile/issues"
                  className="profile-action-link"
                >
                  <span>
                    <i className="bi bi-headset" />
                  </span>

                  <div>
                    <strong>My Issues</strong>
                    <small>
                      View your support requests
                    </small>
                  </div>

                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}