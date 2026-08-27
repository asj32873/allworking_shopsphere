import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
const next = {
  PLACED: ["CONFIRMED"],
  CONFIRMED: ["PACKED"],
  PACKED: ["DISPATCHED"],
  DISPATCHED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
};
export default function VendorOrders() {
  const { orders, user, updateVendorOrderStatus } = useApp();
  const mine = orders
    .map((o) => ({
      ...o,
      items: o.items.filter((i) => i.vendorId === user.id),
    }))
    .filter((o) => o.items.length);
  return (
    <PortalLayout type="vendor">
      <div className="py-4">
        <h2>Vendor Orders</h2>
        <p className="text-muted">
          Status changes affect only your products in a multi-vendor order.
        </p>
        {mine.map((o) => (
          <div className="card mb-3" key={o.id}>
            <div className="card-header">
              <strong>Order #{o.id}</strong>
            </div>
            <div className="card-body">
              {o.items.map((i) => (
                <div className="border rounded p-3 mb-2" key={i.id}>
                  <div className="row align-items-center">
                    <div className="col-lg-5">
                      <strong>{i.name}</strong>
                      <div>Qty: {i.quantity}</div>
                    </div>
                    <div className="col-lg-3">
                      <span className="badge text-bg-primary">
                        {i.vendorStatus}
                      </span>
                    </div>
                    <div className="col-lg-4">
                      <select
                        className="form-select"
                        value={i.vendorStatus}
                        onChange={(e) =>
                          updateVendorOrderStatus(o.id, i.id, e.target.value)
                        }
                        disabled={!next[i.vendorStatus]?.length}
                      >
                        <option>{i.vendorStatus}</option>
                        {next[i.vendorStatus]?.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
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
