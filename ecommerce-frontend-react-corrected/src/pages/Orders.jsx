import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Orders() {
  const orders = useSelector((state) => state.orders.items);

  const user = useSelector((state) => state.auth.user);

  const userId = user?._id || user?.id;

  const mine = orders.filter((o) => String(o.userId) === String(userId));

  return (
    <div className="container py-4">
      <h2>My Orders</h2>

      {mine.length === 0 && (
        <div className="alert alert-info">No orders found.</div>
      )}

      {mine.map((o) => {
        const orderId = o._id || o.id;

        return (
          <div className="card mb-3" key={orderId}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <strong>Order #{orderId}</strong>

                <span className="badge text-bg-primary">{o.status}</span>
              </div>

              <div className="d-flex justify-content-between mt-3">
                <strong>Total</strong>

                <strong>
                  ₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}
                </strong>
              </div>

              <Link
                to={`/orders/${orderId}`}
                className="btn btn-outline-primary mt-3"
              >
                Track Order
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
