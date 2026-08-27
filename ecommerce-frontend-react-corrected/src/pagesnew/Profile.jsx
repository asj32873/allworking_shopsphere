import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Profile() {
  const { user, addresses, orders, reviews, issues } = useApp();

  const mineAddresses = addresses.filter(
    (a) => String(a.userId) === String(user.id)
  );

  const mineOrders = orders.filter(
    (o) => String(o.userId) === String(user.id)
  );

  const mineReviews = reviews.filter(
    (r) => String(r.userId) === String(user.id)
  );

  const mineIssues = issues.filter(
    (i) => String(i.userId) === String(user.id)
  );

  return (
    <div className="container py-4">
      <h2>Profile</h2>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5>Personal Information</h5>
              <p>
                Name: <strong>{user.name}</strong>
              </p>
              <p>
                Email: <strong>{user.email}</strong>
              </p>
              <p>
                Role: <strong>{user.role}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h5>Addresses</h5>
                <Link to="/profile/addresses">Manage</Link>
              </div>

              {mineAddresses.map((a) => (
                <div className="border p-2 mb-2" key={a.id}>
                  {a.type}: {a.addressLine}, {a.city} - {a.pincode}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="row text-center">
                <div className="col">
                  <b className="fs-3">{mineOrders.length}</b>
                  <div>Orders</div>
                </div>

                <div className="col">
                  <b className="fs-3">{mineReviews.length}</b>
                  <div>Reviews</div>
                </div>

                <div className="col">
                  <b className="fs-3">{mineIssues.length}</b>
                  <div>Issues</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <Link
              className="btn btn-outline-primary"
              to="/profile/reviews"
            >
              My Reviews
            </Link>

            <Link
              className="btn btn-outline-primary"
              to="/profile/issues"
            >
              My Issues
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
