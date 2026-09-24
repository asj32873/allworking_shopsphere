import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Orders() {
  const orders = useSelector((state) => state.orders.items);

  const user = useSelector((state) => state.auth.user);

  const userId = user?._id || user?.id;

  const mine = orders.filter(
    (o) => String(o.userId) === String(userId)
  );

  return (
    <div className="orders-page">
      <div className="container">
        <header className="orders-header">
          <div>
            <div className="orders-eyebrow">PURCHASE HISTORY</div>

            <h1 className="orders-title">My Orders</h1>

            <p className="orders-subtitle">
              View your purchases and track their delivery status.
            </p>
          </div>

          <div className="orders-count">
            {mine.length}{" "}
            {mine.length === 1 ? "order" : "orders"}
          </div>
        </header>

        {mine.length === 0 && (
          <div className="orders-empty">
            <div className="orders-empty-icon">
              <i className="bi bi-bag" />
            </div>

            <div className="orders-empty-eyebrow">
              ORDER HISTORY
            </div>

            <h2 className="orders-empty-title">
              No orders yet
            </h2>

            <p className="orders-empty-description">
              Your completed purchases will appear here once you
              place an order.
            </p>

            <Link
              to="/products"
              className="orders-primary-button"
            >
              Browse Products
              <i className="bi bi-arrow-right" />
            </Link>
          </div>
        )}

        {mine.length > 0 && (
          <section className="orders-list">
            <div className="orders-list-header">
              <span>Your Orders</span>
              <span>{mine.length}</span>
            </div>

            {mine.map((o) => {
              const orderId = o._id || o.id;

              return (
                <article
                  className="order-card"
                  key={orderId}
                >
                  <div className="order-card-top">
                    <div className="order-card-identity">
                      <div className="order-card-icon">
                        <i className="bi bi-box-seam" />
                      </div>

                      <div>
                        <div className="order-card-label">
                          ORDER
                        </div>

                        <h2 className="order-card-id">
                          #{orderId}
                        </h2>
                      </div>
                    </div>

                    <span className="order-status-badge">
                      <span className="order-status-dot" />
                      {o.status}
                    </span>
                  </div>

                  <div className="order-card-divider" />

                  <div className="order-card-bottom">
                    <div className="order-total">
                      <span className="order-total-label">
                        Total Amount
                      </span>

                      <strong>
                        ₹
                        {Number(
                          o.totalAmount || 0,
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <Link
                      to={`/orders/${orderId}`}
                      className="order-track-button"
                    >
                      Track Order
                      <i className="bi bi-arrow-right" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}