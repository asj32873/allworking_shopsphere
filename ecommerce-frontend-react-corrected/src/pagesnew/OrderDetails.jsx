import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import OrderTracking from "../components/orders/OrderTracking";

export default function OrderDetails() {
  const { id } = useParams();
  const { loadOrder, addresses, user } = useApp();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrder(id)
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [id, loadOrder]);

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!order) {
    return <div className="container py-5">Loading order...</div>;
  }

  if (
    user?.role === "USER" &&
    String(order.userId) !== String(user.id)
  ) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Order not found.</div>
      </div>
    );
  }

  const address = addresses.find(
    (x) => String(x.id) === String(order.addressId)
  );

  return (
    <div className="container py-4">
      <Link to="/orders">← Orders</Link>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h3>Order #{order.id}</h3>

              {order.items.map((i) => (
                <div className="border-bottom py-3" key={i.id}>
                  <div className="d-flex justify-content-between">
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <strong>
                      ₹{(i.unitPrice * i.quantity).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <small>
                    Vendor status: <strong>{i.vendorStatus}</strong>
                  </small>
                </div>
              ))}

              <div className="d-flex justify-content-between fs-5 mt-3">
                <strong>Total</strong>
                <strong>
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </strong>
              </div>

              {address && (
                <div className="alert alert-light mt-3">
                  {address.addressLine}, {address.city},{" "}
                  {address.state} - {address.pincode}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          {order.items.map((i) => (
            <div className="card mb-3" key={i.id}>
              <div className="card-body">
                <h5>{i.name}</h5>
                <OrderTracking item={i} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
