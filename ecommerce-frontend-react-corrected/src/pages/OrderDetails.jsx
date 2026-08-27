import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import OrderTracking from "../components/orders/OrderTracking";

export default function OrderDetails() {
  const { id } = useParams();
  const { orders, addresses, user } = useApp();

  const o = orders.find((x) => x.id === id);

  if (!o || o.userId !== user.id) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Order not found.</div>
      </div>
    );
  }

  const a = addresses.find((x) => x.id === o.addressId);

  return (
    <div className="container py-4">
      <Link to="/orders">← Orders</Link>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h3>Order #{o.id}</h3>

              {o.items.map((i) => (
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
                <strong>₹{o.totalAmount.toLocaleString("en-IN")}</strong>
              </div>

              {a && (
                <div className="alert alert-light mt-3">
                  {a.addressLine}, {a.city}, {a.state} - {a.pincode}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          {o.items.map((i) => (
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
