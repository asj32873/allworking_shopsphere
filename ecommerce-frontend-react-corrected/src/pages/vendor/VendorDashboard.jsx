import { useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

export default function VendorDashboard() {
  const products = useSelector((state) => state.products.items);

  const orders = useSelector((state) => state.orders.items);

  const issues = useSelector((state) => state.issues.items);

  const user = useSelector((state) => state.auth.user);

  const ps = products.filter((p) => String(p.vendorId) === String(user?.id));

  const os = orders.filter((o) =>
    (o.items || []).some(
      (i) => String(i.vendorId) === String(user?.id),
    ),
  );

  const vendorIssues = issues.filter(
    (i) => String(i.vendorId) === String(user?.id),
  );

  const sales = os.reduce(
    (total, order) =>
      total +
      (order.items || [])
        .filter(
          (item) => String(item.vendorId) === String(user?.id),
        )
        .reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ),
    0,
  );

  const stats = [
    {
      label: "Products",
      value: ps.length,
      icon: "bi-box-seam",
      description: "Active products in your catalog",
    },
    {
      label: "Orders",
      value: os.length,
      icon: "bi-receipt",
      description: "Orders containing your products",
    },
    {
      label: "Low Stock",
      value: ps.filter((p) => p.stock < 10).length,
      icon: "bi-exclamation-triangle",
      description: "Products below stock threshold",
    },
    {
      label: "Open Issues",
      value: vendorIssues.filter((i) => i.status !== "RESOLVED").length,
      icon: "bi-life-preserver",
      description: "Issues requiring attention",
    },
    {
      label: "Sales",
      value: `₹${sales.toLocaleString("en-IN")}`,
      icon: "bi-graph-up-arrow",
      description: "Sales from your products",
      featured: true,
    },
  ];

  return (
    <PortalLayout type="vendor">
      <div className="vendor-dashboard">
        <header className="vendor-dashboard-header">
          <div>
            <div className="vendor-dashboard-eyebrow">
              VENDOR OVERVIEW
            </div>

            <h1 className="vendor-dashboard-title">
              Vendor Dashboard
            </h1>

            <p className="vendor-dashboard-subtitle">
              Keep track of your products, orders, stock, issues, and sales.
            </p>
          </div>

          <div className="vendor-dashboard-badge">
            <span className="vendor-dashboard-badge-dot" />
            Vendor Portal
          </div>
        </header>

        <section className="vendor-dashboard-stats">
          {stats.map((stat) => (
            <div
              className={`vendor-stat-card${
                stat.featured ? " vendor-stat-card-featured" : ""
              }`}
              key={stat.label}
            >
              <div className="vendor-stat-top">
                <div className="vendor-stat-icon">
                  <i className={`bi ${stat.icon}`} />
                </div>

                <span className="vendor-stat-label">
                  {stat.label}
                </span>
              </div>

              <div className="vendor-stat-value">
                {stat.value}
              </div>

              <p className="vendor-stat-description">
                {stat.description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </PortalLayout>
  );
}