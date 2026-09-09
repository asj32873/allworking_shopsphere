import { useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

export default function VendorDashboard() {
  const products = useSelector((state) => state.products.items);

  const orders = useSelector((state) => state.orders.items);

  const issues = useSelector((state) => state.issues.items);

  const user = useSelector((state) => state.auth.user);

  const ps = products.filter((p) => String(p.vendorId) === String(user?.id));

  const os = orders.filter((o) =>
    (o.items || []).some((i) => String(i.vendorId) === String(user?.id)),
  );

  const vendorIssues = issues.filter(
    (i) => String(i.vendorId) === String(user?.id),
  );

  const sales = os.reduce(
    (total, order) =>
      total +
      (order.items || [])
        .filter((item) => String(item.vendorId) === String(user?.id))
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    0,
  );

  return (
    <PortalLayout type="vendor">
      <div className="py-4">
        <h2>Vendor Dashboard</h2>

        <div className="row g-3">
          {[
            ["Products", ps.length],
            ["Orders", os.length],
            ["Low Stock", ps.filter((p) => p.stock < 10).length],
            [
              "Open Issues",
              vendorIssues.filter((i) => i.status !== "RESOLVED").length,
            ],
            ["Sales", `₹${sales.toLocaleString("en-IN")}`],
          ].map(([label, value]) => (
            <div className="col-sm-6 col-xl-3" key={label}>
              <div className="card stat-card">
                <div className="card-body">
                  <small>{label}</small>

                  <div className="fs-2 fw-bold">{value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
