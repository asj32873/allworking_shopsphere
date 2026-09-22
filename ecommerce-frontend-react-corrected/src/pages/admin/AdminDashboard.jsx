import { useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

export default function AdminDashboard() {
  const users = useSelector((state) => state.users.items);

  const vendors = useSelector((state) => state.vendors.items);

  const products = useSelector((state) => state.products.items);

  const orders = useSelector((state) => state.orders.items);

  const issues = useSelector((state) => state.issues.items);

  const stats = [
    {
      label: "Users",
      value: users.length,
      icon: "bi-people",
      description: "Registered platform users",
    },
    {
      label: "Vendors",
      value: vendors.length,
      icon: "bi-shop",
      description: "Vendor accounts on the platform",
    },
    {
      label: "Pending Vendors",
      value: vendors.filter((v) => v.status === "APPLIED").length,
      icon: "bi-person-check",
      description: "Vendor applications awaiting review",
      attention: true,
    },
    {
      label: "Products",
      value: products.length,
      icon: "bi-box-seam",
      description: "Products across all vendors",
    },
    {
      label: "Open Issues",
      value: issues.filter(
        (i) => !["RESOLVED", "CLOSED"].includes(i.status),
      ).length,
      icon: "bi-exclamation-circle",
      description: "Issues requiring attention",
      attention: true,
    },
    {
      label: "Orders",
      value: orders.length,
      icon: "bi-receipt",
      description: "Orders across the platform",
    },
  ];

  return (
    <PortalLayout type="admin">
      <div className="admin-dashboard">
        <header className="admin-dashboard-header">
          <div>
            <div className="admin-dashboard-eyebrow">
              ADMIN OVERVIEW
            </div>

            <h1 className="admin-dashboard-title">
              Admin Dashboard
            </h1>

            <p className="admin-dashboard-subtitle">
              Monitor users, vendors, products, orders, and platform issues
              from one place.
            </p>
          </div>

          <div className="admin-dashboard-badge">
            <span className="admin-dashboard-badge-dot" />
            Admin Portal
          </div>
        </header>

        <section className="admin-dashboard-stats">
          {stats.map((stat) => (
            <div
              className={`admin-stat-card${
                stat.attention ? " admin-stat-card-attention" : ""
              }`}
              key={stat.label}
            >
              <div className="admin-stat-top">
                <div className="admin-stat-icon">
                  <i className={`bi ${stat.icon}`} />
                </div>

                <span className="admin-stat-label">
                  {stat.label}
                </span>
              </div>

              <div className="admin-stat-value">
                {stat.value}
              </div>

              <p className="admin-stat-description">
                {stat.description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </PortalLayout>
  );
}

export default AdminDashboard;