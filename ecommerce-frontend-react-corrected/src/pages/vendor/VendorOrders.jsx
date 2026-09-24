import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { updateVendorOrderStatus } from "../../store/slices/orderSlice";

const next = {
  PLACED: ["CONFIRMED"],
  CONFIRMED: ["PACKED"],
  PACKED: ["DISPATCHED"],
  DISPATCHED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
};

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

export default function VendorOrders() {
  const dispatch = useDispatch();

  const orders = useSelector((state) => state.orders.items);

  const user = useSelector((state) => state.auth.user);

  const mine = orders
    .map((order) => ({
      ...order,
      items: (order.items || []).filter(
        (item) => String(item.vendorId) === String(user?.id),
      ),
    }))
    .filter((order) => order.items.length);

  const totalItems = mine.reduce(
    (total, order) => total + order.items.length,
    0,
  );

  const activeItems = mine.reduce(
    (total, order) =>
      total +
      order.items.filter(
        (item) =>
          item.vendorStatus !== "DELIVERED" &&
          item.vendorStatus !== "CANCELLED" &&
          item.vendorStatus !== "RETURNED",
      ).length,
    0,
  );

  return (
    <PortalLayout type="vendor">
      <div className="vendor-orders-page">
        <header className="vendor-orders-header">
          <div>
            <div className="vendor-orders-eyebrow">
              ORDER MANAGEMENT
            </div>

            <h1 className="vendor-orders-title">
              Vendor Orders
            </h1>

            <p className="vendor-orders-subtitle">
              Manage fulfillment status for your products across
              multi-vendor orders.
            </p>
          </div>

          <div className="vendor-orders-summary">
            <div className="vendor-orders-summary-item">
              <span className="vendor-orders-summary-value">
                {mine.length}
              </span>

              <span className="vendor-orders-summary-label">
                Orders
              </span>
            </div>

            <div className="vendor-orders-summary-divider" />

            <div className="vendor-orders-summary-item">
              <span className="vendor-orders-summary-value">
                {activeItems}
              </span>

              <span className="vendor-orders-summary-label">
                Active Items
              </span>
            </div>
          </div>
        </header>

        <div className="vendor-orders-notice">
          <div className="vendor-orders-notice-icon">
            <i className="bi bi-info-circle" />
          </div>

          <div>
            <strong>Multi-vendor order handling</strong>

            <p>
              Status changes affect only your products within an order.
            </p>
          </div>
        </div>

        {mine.length > 0 ? (
          <div className="vendor-orders-list">
            {mine.map((o) => (
              <article className="vendor-order-card" key={o.id}>
                <div className="vendor-order-header">
                  <div className="vendor-order-identity">
                    <div className="vendor-order-icon">
                      <i className="bi bi-receipt" />
                    </div>

                    <div>
                      <div className="vendor-order-eyebrow">
                        ORDER
                      </div>

                      <h2 className="vendor-order-id">
                        #{o.id}
                      </h2>
                    </div>
                  </div>

                  <div className="vendor-order-item-count">
                    {o.items.length}{" "}
                    {o.items.length === 1 ? "item" : "items"}
                  </div>
                </div>

                <div className="vendor-order-items">
                  {o.items.map((i) => {
                    const currentStatus = i.vendorStatus;
                    const availableNext = next[currentStatus] || [];
                    const isComplete =
                      currentStatus === "DELIVERED" ||
                      currentStatus === "CANCELLED" ||
                      currentStatus === "RETURNED";

                    return (
                      <div className="vendor-order-item" key={i.id}>
                        <div className="vendor-order-item-main">
                          <div className="vendor-order-product-icon">
                            <i className="bi bi-box-seam" />
                          </div>

                          <div className="vendor-order-product-info">
                            <div className="vendor-order-product-name">
                              {i.name}
                            </div>

                            <div className="vendor-order-product-quantity">
                              Quantity: {i.quantity}
                            </div>
                          </div>
                        </div>

                        <div className="vendor-order-item-status">
                          <span
                            className={`vendor-order-status vendor-order-status-${String(
                              currentStatus,
                            ).toLowerCase()}`}
                          >
                            <span className="vendor-order-status-dot" />
                            {statusLabels[currentStatus] || currentStatus}
                          </span>
                        </div>

                        <div className="vendor-order-item-action">
                          <label
                            htmlFor={`status-${o.id}-${i.id}`}
                            className="vendor-order-select-label"
                          >
                            Update status
                          </label>

                          <select
                            id={`status-${o.id}-${i.id}`}
                            className="vendor-order-status-select"
                            value={currentStatus}
                            onChange={(e) =>
                              dispatch(
                                updateVendorOrderStatus({
                                  orderId: o.id,
                                  itemId: i.id,
                                  status: e.target.value,
                                }),
                              )
                            }
                            disabled={!availableNext.length}
                          >
                            <option value={currentStatus}>
                              {statusLabels[currentStatus] || currentStatus}
                            </option>

                            {availableNext.map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status] || status}
                              </option>
                            ))}
                          </select>

                          {isComplete && (
                            <div className="vendor-order-status-complete">
                              <i className="bi bi-check-circle" />
                              Final status
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="vendor-orders-empty">
            <div className="vendor-orders-empty-icon">
              <i className="bi bi-receipt" />
            </div>

            <div className="vendor-orders-empty-eyebrow">
              NO ORDERS
            </div>

            <h2>No vendor orders yet</h2>

            <p>
              Orders containing your products will appear here when
              customers make purchases.
            </p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}