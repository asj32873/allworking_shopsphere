import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
export default function VendorDashboard() {
  const { products, orders, issues, user } = useApp();
  const ps = products.filter((p) => p.vendorId === user.id),
    os = orders.filter((o) => o.items.some((i) => i.vendorId === user.id)),
    is = issues.filter((i) => i.vendorId === user.id),
    sales = os.reduce(
      (s, o) =>
        s +
        o.items
          .filter((i) => i.vendorId === user.id)
          .reduce((a, i) => a + i.quantity * i.unitPrice, 0),
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
            ["Open Issues", is.filter((i) => i.status !== "RESOLVED").length],
            ["Sales", `₹${sales.toLocaleString("en-IN")}`],
          ].map(([a, b]) => (
            <div className="col-sm-6 col-xl-3" key={a}>
              <div className="card stat-card">
                <div className="card-body">
                  <small>{a}</small>
                  <div className="fs-2 fw-bold">{b}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
