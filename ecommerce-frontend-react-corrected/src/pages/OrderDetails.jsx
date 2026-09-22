import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import OrderTracking from "../components/orders/OrderTracking";

export default function OrderDetails() {
  const { id } = useParams();

  const orders = useSelector((state) => state.orders.items);
  const addresses = useSelector((state) => state.addresses.items);
  const user = useSelector((state) => state.auth.user);

  const o = orders.find(
    (x) => String(x._id || x.id) === String(id),
  );

  const userId = user?._id || user?.id;

  if (!o || String(o.userId) !== String(userId)) {
    return (
      <div className="order-details-page">
        <div className="container">
          <div className="order-details-not-found">
            <div className="order-details-not-found-icon">
              <i className="bi bi-box-seam" />
            </div>

            <div className="order-details-eyebrow">
              ORDER
            </div>

            <h1>Order not found</h1>

            <p>
              We couldn't find this order in your account.
            </p>

            <Link
              to="/orders"
              className="order-details-primary-button"
            >
              <i className="bi bi-arrow-left" />
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderId = o._id || o.id;

  const a = addresses.find(
    (x) =>
      String(x._id || x.id) === String(o.addressId),
  );

  return (
    <div className="order-details-page">
      <div className="container">
        <header className="order-details-header">
          <Link
            to="/orders"
            className="order-details-back"
          >
            <i className="bi bi-arrow-left" />
            Orders
          </Link>

          <div className="order-details-eyebrow">
            ORDER DETAILS
          </div>

          <div className="order-details-title-row">
            <div>
              <h1>Order #{orderId}</h1>

              <p>
                Review your order, payment, delivery details,
                and tracking status.
              </p>
            </div>

            <span className="order-details-status">
              <span className="order-details-status-dot" />
              {o.status}
            </span>
          </div>
        </header>

        <div className="order-details-layout">
          {/* MAIN ORDER CONTENT */}
          <main className="order-details-main">
            <section className="order-details-card">
              <div className="order-details-card-header">
                <div className="order-details-card-heading">
                  <div className="order-details-card-icon">
                    <i className="bi bi-receipt" />
                  </div>

                  <div>
                    <div className="order-details-card-eyebrow">
                      PURCHASE
                    </div>

                    <h2>Order Items</h2>
                  </div>
                </div>

                <span className="order-details-item-count">
                  {(o.items || []).length}{" "}
                  {(o.items || []).length === 1
                    ? "item"
                    : "items"}
                </span>
              </div>

              <div className="order-items-list">
                {(o.items || []).map((item) => (
                  <div
                    className="order-detail-item"
                    key={item.id || item._id}
                  >
                    <div className="order-detail-item-main">
                      <div className="order-detail-item-icon">
                        <i className="bi bi-box" />
                      </div>

                      <div className="order-detail-item-info">
                        <h3>{item.name}</h3>

                        <div className="order-detail-item-meta">
                          <span>
                            Qty: {item.quantity}
                          </span>

                          <span className="order-detail-item-separator">
                            ·
                          </span>

                          <span>
                            ₹
                            {Number(
                              item.unitPrice || 0,
                            ).toLocaleString("en-IN")}{" "}
                            each
                          </span>
                        </div>

                        <div className="order-detail-vendor-status">
                          Vendor Status:{" "}
                          <strong>
                            {item.vendorStatus}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <strong className="order-detail-item-total">
                      ₹
                      {(
                        Number(item.unitPrice || 0) *
                        Number(item.quantity || 0)
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-details-total">
                <span>Total</span>

                <strong>
                  ₹
                  {Number(
                    o.totalAmount || 0,
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            </section>

            {/* DELIVERY */}
            {a && (
              <section className="order-details-card">
                <div className="order-details-card-header">
                  <div className="order-details-card-heading">
                    <div className="order-details-card-icon">
                      <i className="bi bi-geo-alt" />
                    </div>

                    <div>
                      <div className="order-details-card-eyebrow">
                        DELIVERY
                      </div>

                      <h2>Delivery Address</h2>
                    </div>
                  </div>
                </div>

                <div className="order-details-address">
                  <div className="order-details-address-type">
                    <i className="bi bi-house" />
                    {a.type || "Delivery"}
                  </div>

                  <p>{a.addressLine}</p>

                  <p>
                    {a.city}, {a.state} - {a.pincode}
                  </p>
                </div>
              </section>
            )}

            {/* PAYMENT */}
            <section className="order-details-card">
              <div className="order-details-card-header">
                <div className="order-details-card-heading">
                  <div className="order-details-card-icon">
                    <i className="bi bi-credit-card" />
                  </div>

                  <div>
                    <div className="order-details-card-eyebrow">
                      PAYMENT
                    </div>

                    <h2>Payment Status</h2>
                  </div>
                </div>
              </div>

              <div className="order-payment-status">
                <div className="order-payment-status-icon">
                  <i className="bi bi-check2-circle" />
                </div>

                <div>
                  <strong>{o.paymentStatus}</strong>

                  <span>
                    Payment information for this order
                  </span>
                </div>
              </div>
            </section>
          </main>

          {/* TRACKING */}
          <aside className="order-details-sidebar">
            <section className="order-tracking-card">
              <div className="order-details-card-header">
                <div className="order-details-card-heading">
                  <div className="order-details-card-icon">
                    <i className="bi bi-truck" />
                  </div>

                  <div>
                    <div className="order-details-card-eyebrow">
                      DELIVERY
                    </div>

                    <h2>Order Tracking</h2>
                  </div>
                </div>
              </div>

              <div className="order-tracking-content">
                <OrderTracking order={o} />
              </div>
            </section>

            <Link
              to="/orders"
              className="order-details-orders-link"
            >
              <i className="bi bi-arrow-left" />
              Back to all orders
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}