import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Profile() {
  const user = useSelector((state) => state.auth.user);

  const addresses = useSelector((state) => state.addresses.items);

  const orders = useSelector((state) => state.orders.items);

  const reviews = useSelector((state) => state.reviews.items);

  const issues = useSelector((state) => state.issues.items);

  const mineAddresses = addresses.filter(
    (a) => !a.userId || String(a.userId) === String(user?.id),
  );

  const mineOrders = orders.filter(
    (o) => !o.userId || String(o.userId) === String(user?.id),
  );

  const mineReviews = reviews.filter(
    (r) => String(r.userId) === String(user?.id),
  );

  const mineIssues = issues.filter(
    (i) => !i.userId || String(i.userId) === String(user?.id),
  );

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h3>{user?.name}</h3>

              <p>{user?.email}</p>

              <p>
                <span className="badge text-bg-primary">{user?.role}</span>
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
            <Link className="btn btn-outline-primary" to="/profile/reviews">
              My Reviews
            </Link>

            <Link className="btn btn-outline-primary" to="/profile/issues">
              My Issues
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
