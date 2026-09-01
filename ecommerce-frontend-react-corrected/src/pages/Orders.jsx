import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Orders() {
  const { orders, user } = useApp();

  const mine = orders.filter(
    (o) => String(o.userId) === String(user?._id || user?.id),
  );

  return (
    <div className="container py-4">
      <h2>My Orders</h2>

      {mine.length === 0 && (
        <div className="alert alert-info">No orders found.</div>
      )}

      {mine.map((o) => (
        <div className="card mb-3" key={o._id}>
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <strong>Order #{o._id}</strong>

              <span className="badge text-bg-primary">{o.status}</span>
            </div>

            <div className="d-flex justify-content-between mt-3">
              <strong>Total</strong>

              <strong>₹{o.totalAmount?.toLocaleString("en-IN")}</strong>
            </div>

            <Link
              to={`/orders/${o._id}`}
              className="btn btn-outline-primary mt-3"
            >
              Track Order
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
