import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
export default function Cart() {
  const {
    cartItems,
    cartTotal,
    updateCartQty,
    removeFromCart,
    addresses,
    createCheckoutSession,
    user,
  } = useApp();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const nav = useNavigate();
  const mine = addresses.filter((a) => a.userId === user.id);
  const [address, setAddress] = useState(
    mine.find((a) => a.isDefault)?.id || mine[0]?.id || "",
  );
  if (!cartItems.length)
    return (
      <div className="container py-5 text-center">
        <h2>Cart is empty</h2>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  const handleCheckout = async () => {
    if (!address) return;

    try {
      setPaymentLoading(true);
      setPaymentError("");

      const data = await createCheckoutSession(address);

      if (!data?.url) {
        throw new Error("Stripe Checkout URL was not returned.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Stripe checkout error:", error);

      setPaymentError(error.message || "Unable to start payment.");
    } finally {
      setPaymentLoading(false);
    }
  };
  return (
    <div className="container py-4">
      <h2>Cart</h2>
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
                  onChange={(e) => updateCartQty(i.productId, +e.target.value)}
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
                onChange={(e) => setAddress(+e.target.value)}
              >
                {mine.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type}: {a.addressLine}, {a.city}
                  </option>
                ))}
              </select>
              {paymentError && (
                <div className="alert alert-danger">{paymentError}</div>
              )}

              <button
                className="btn btn-success w-100"
                disabled={!address || paymentLoading}
                onClick={handleCheckout}
              >
                {paymentLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <i className="bi bi-credit-card me-2" />
                    Pay with Stripe
                  </>
                )}
              </button>

              <div className="small text-muted mt-2 text-center">
                Development mode — no real money will be charged.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
