import { useDispatch, useSelector } from "react-redux";
import PortalLayout from "../../components/common/PortalLayout";

import { updateAdminOrderStatus } from "../../store/slices/orderSlice";

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
  const dispatch = useDispatch();

  const orders = useSelector((state) => state.orders.items);

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
              {(o.items || []).map((i) => (
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
                        dispatch(
                          updateAdminOrderStatus({
                            orderId: o.id,
                            itemId: i.id,
                            status: e.target.value,
                          }),
                        )
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
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
