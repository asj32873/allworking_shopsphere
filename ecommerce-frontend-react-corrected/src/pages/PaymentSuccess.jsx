import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <div className="payment-result-page">
      <div className="container">
        <div className="payment-success-card">
          <div className="payment-success-icon">
            <i className="bi bi-check-lg" />
          </div>

          <div className="payment-success-eyebrow">
            PAYMENT COMPLETE
          </div>

          <h1>Payment Successful</h1>

          <p className="payment-success-message">
            Your test payment was successful. Your order is
            being created.
          </p>

          <div className="payment-success-status">
            <span className="payment-success-status-dot" />

            <span>
              Payment confirmed
            </span>
          </div>

          <Link
            to="/orders"
            className="payment-success-button"
          >
            View My Orders
            <i className="bi bi-arrow-right" />
          </Link>

          <Link
            to="/products"
            className="payment-success-secondary"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}