import { Link } from "react-router-dom";

export default function PaymentCancel() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card shadow-sm text-center">
            <div className="card-body p-5">
              <div className="display-4 text-warning mb-3">
                <i className="bi bi-x-circle-fill" />
              </div>

              <h2>Payment Cancelled</h2>

              <p className="text-muted">
                No order was created. Your cart is still available.
              </p>

              <Link to="/cart" className="btn btn-primary">
                Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
