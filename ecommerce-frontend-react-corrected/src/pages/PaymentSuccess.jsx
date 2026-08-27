import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card shadow-sm text-center">
            <div className="card-body p-5">
              <div className="display-4 text-success mb-3">
                <i className="bi bi-check-circle-fill" />
              </div>

              <h2>Payment Successful</h2>

              <p className="text-muted">
                Your test payment was successful. Your order is being created.
              </p>

              <Link to="/orders" className="btn btn-primary">
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
