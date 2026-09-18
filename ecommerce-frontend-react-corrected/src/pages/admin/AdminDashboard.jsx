import { useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

export default function AdminDashboard() {
  const users = useSelector((state) => state.users.items);

  const vendors = useSelector((state) => state.vendors.items);

  const products = useSelector((state) => state.products.items);

  const orders = useSelector((state) => state.orders.items);

  const issues = useSelector((state) => state.issues.items);

  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Admin Dashboard</h2>

        <div className="row g-3">
          {[
            ["Users", users.length],
            ["Vendors", vendors.length],
            [
              "Pending Vendors",
              vendors.filter((v) => v.status === "APPLIED").length,
            ],
            ["Products", products.length],
            [
              "Open Issues",
              issues.filter((i) => !["RESOLVED", "CLOSED"].includes(i.status))
                .length,
            ],
            ["Orders", orders.length],
          ].map(([a, b]) => (
            <div className="col-sm-6 col-xl-4" key={a}>
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
