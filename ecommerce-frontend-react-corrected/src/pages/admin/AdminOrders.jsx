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

const statusLabels = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default function AdminOrders() {
  const dispatch = useDispatch();

  const orders = useSelector((state) => state.orders.items);

  const totalItems = orders.reduce(
    (total, order) => total + (order.items || []).length,
    0,
  );

  return (
    <PortalLayout type="admin">
      <div className="admin-orders-page">
        <header className="admin-orders-header">
          <div>
            <div className="admin-orders-eyebrow">
              ORDER MANAGEMENT
            </div>

            <h1 className="admin-orders-title">
              Order Management
            </h1>

            <p className="admin-orders-subtitle">
              Monitor platform orders and manage item-level fulfillment
              status across vendors.
            </p>
          </div>

          <div className="admin-orders-summary">
            <div className="admin-orders-summary-item">
              <span className="admin-orders-summary-value">
                {orders.length}
              </span>

              <span className="admin-orders-summary-label">
                Orders
              </span>
            </div>

            <div className="admin-orders-summary-divider" />

            <div className="admin-orders-summary-item">
              <span className="admin-orders-summary-value">
                {totalItems}
              </span>

              <span className="admin-orders-summary-label">
                Items
              </span>
            </div>
          </div>
        </header>

        {orders.length > 0 ? (
          <div className="admin-orders-list">
            {orders.map((o) => (
              <article className="admin-order-card" key={o.id}>
                <div className="admin-order-card-header">
                  <div className="admin-order-identity">
                    <div className="admin-order-icon">
                      <i className="bi bi-receipt" />
                    </div>

                    <div>
                      <div className="admin-order-eyebrow">
                        ORDER
                      </div>

                      <h2 className="admin-order-id">
                        #{o.id}
                      </h2>
                    </div>
                  </div>

                  <div className="admin-order-item-count">
                    {(o.items || []).length}{" "}
                    {(o.items || []).length === 1
                      ? "item"
                      : "items"}
                  </div>
                </div>

                <div className="admin-order-items">
                  {(o.items || []).map((i) => (
                    <div className="admin-order-item" key={i.id}>
                      <div className="admin-order-product">
                        <div className="admin-order-product-icon">
                          <i className="bi bi-box-seam" />
                        </div>

                        <div>
                          <div className="admin-order-product-name">
                            {i.name}
                          </div>

                          <div className="admin-order-product-quantity">
                            Quantity: {i.quantity}
                          </div>
                        </div>
                      </div>

                      <div className="admin-order-current-status">
                        <div className="admin-order-status-label">
                          Current Status
                        </div>

                        <span
                          className={`admin-order-status admin-order-status-${String(
                            i.vendorStatus,
                          ).toLowerCase()}`}
                        >
                          <span className="admin-order-status-dot" />
                          {statusLabels[i.vendorStatus] ||
                            i.vendorStatus}
                        </span>
                      </div>

                      <div className="admin-order-update">
                        <label
                          htmlFor={`admin-status-${o.id}-${i.id}`}
                        >
                          Update Status
                        </label>

                        <select
                          id={`admin-status-${o.id}-${i.id}`}
                          className="admin-order-select"
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
                            <option key={status} value={status}>
                              {statusLabels[status] || status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-orders-empty">
            <div className="admin-orders-empty-icon">
              <i className="bi bi-receipt" />
            </div>

            <div className="admin-orders-empty-eyebrow">
              NO ORDERS
            </div>

            <h2>No orders yet</h2>

            <p>
              Platform orders will appear here when customers complete
              purchases.
            </p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}