import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
export default function Orders() {
  const { orders, user } = useApp(),
    mine = orders.filter((o) => o.userId === user.id);
  return (
    <div className="container py-4">
      <h2>My Orders</h2>
      {mine.map((o) => (
        <div className="card mb-3" key={o.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <strong>Order #{o.id}</strong>
              <span className="badge text-bg-primary">{o.status}</span>
            </div>
            {o.items.map((i) => (
              <div
                className="border-bottom py-2 d-flex justify-content-between"
                key={i.id}
              >
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{i.vendorStatus}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between mt-3">
              <strong>Total</strong>
              <strong>₹{o.totalAmount.toLocaleString("en-IN")}</strong>
            </div>
            <Link
              to={`/orders/${o.id}`}
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
