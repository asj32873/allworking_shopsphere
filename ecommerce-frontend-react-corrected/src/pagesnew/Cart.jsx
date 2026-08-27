import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Cart() {
  const {
    cartItems,
    cartTotal,
    updateCartQty,
    removeFromCart,
    addresses,
    placeOrder,
    user,
  } = useApp();

  const nav = useNavigate();
  const mine = addresses.filter((a) => String(a.userId) === String(user.id));
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAddress(
      String(mine.find((a) => a.isDefault)?.id || mine[0]?.id || "")
    );
  }, [addresses, user.id]);

  if (!cartItems.length) {
    return (
      <div className="container py-5 text-center">
        <h2>Cart is empty</h2>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const checkout = async () => {
    if (!address) return;
    setError("");
    setBusy(true);

    try {
      const order = await placeOrder(address);
      nav(`/orders/${order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-4">
      <h2>Cart</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          {cartItems.map((i) => (
            <div className="card mb-3" key={i.productId}>
              <div className="card-body d-flex gap-3 align-items-center">
                <img
                  src={i.product.image}
                  alt={i.product.name}
                  style={{ width: 80, height: 70, objectFit: "cover" }}
                />

                <div className="flex-grow-1">
                  <strong>{i.product.name}</strong>
                  <div>₹{i.product.price.toLocaleString("en-IN")}</div>
                </div>

                <input
                  type="number"
                  min="1"
                  max={i.product.stock}
                  className="form-control"
                  style={{ width: 90 }}
                  value={i.quantity}
                  onChange={(e) =>
                    updateCartQty(i.productId, Number(e.target.value))
                  }
                />

                <strong>₹{i.subtotal.toLocaleString("en-IN")}</strong>

                <button
                  className="btn btn-outline-danger"
                  onClick={() => removeFromCart(i.productId)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5>Price Summary</h5>

              <div className="d-flex justify-content-between">
                <span>Total</span>
                <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
              </div>

              <label className="form-label mt-3">Delivery address</label>

              <select
                className="form-select mb-3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              >
                <option value="">Select address</option>
                {mine.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type}: {a.addressLine}, {a.city}
                  </option>
                ))}
              </select>

              <button
                className="btn btn-success w-100"
                disabled={!address || busy}
                onClick={checkout}
              >
                {busy ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
