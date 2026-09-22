import { Link } from "react-router-dom";

export default function PaymentCancel() {
  return (
    <div className="payment-result-page">
      <div className="container">
        <div className="payment-cancel-card">
          <div className="payment-cancel-icon">
            <i className="bi bi-x-lg" />
          </div>

          <div className="payment-cancel-eyebrow">PAYMENT CANCELLED</div>

          <h1>Payment Cancelled</h1>

          <p className="payment-cancel-message">
            No order was created. Your cart is still available.
          </p>

          <div className="payment-cancel-status">
            <span className="payment-cancel-status-dot" />
            <span>No payment was completed</span>
          </div>

          <Link to="/cart" className="payment-cancel-button">
            Return to Cart
            <i className="bi bi-arrow-right" />
          </Link>

          <Link to="/products" className="payment-cancel-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}