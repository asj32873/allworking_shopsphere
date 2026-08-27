import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";

export default function VendorDashboard() {
  const { products, orders, issues, user } = useApp();

  const ps = products.filter(
    (p) => String(p.vendorId) === String(user.id)
  );

  const os = orders.filter((o) =>
    o.items.some(
      (i) => String(i.vendorId) === String(user.id)
    )
  );

  const is = issues.filter(
    (i) => String(i.assignedTo) === String(user.id)
  );

  const sales = os.reduce(
    (s, o) =>
      s +
      o.items
        .filter(
          (i) => String(i.vendorId) === String(user.id)
        )
        .reduce(
          (a, i) => a + i.quantity * i.unitPrice,
          0
        ),
    0
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
              is.filter(
                (i) => !["RESOLVED", "CLOSED"].includes(i.status)
              ).length,
            ],
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
