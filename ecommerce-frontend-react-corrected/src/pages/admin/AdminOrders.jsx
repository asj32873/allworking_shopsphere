import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
const statuses = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];
export default function AdminOrders() {
  const { orders, updateAdminOrderStatus } = useApp();
  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Order Management</h2>
        {orders.map((o) => (
          <div className="card mb-3" key={o.id}>
            <div className="card-header">
              <strong>Order #{o.id}</strong>
            </div>
            <div className="card-body">
              {o.items.map((i) => (
                <div
                  className="border rounded p-2 mb-2 row align-items-center"
                  key={i.id}
                >
                  <div className="col-md-5">
                    {i.name} × {i.quantity}
                  </div>
                  <div className="col-md-3">{i.vendorStatus}</div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={i.vendorStatus}
                      onChange={(e) =>
                        updateAdminOrderStatus(o.id, i.id, e.target.value)
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
