import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Reviews() {
  const {
    user,
    reviews,
    products,
    loadProductReviews,
  } = useApp();

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!products.length) return;

    Promise.all(
      products.map((p) => loadProductReviews(p.id).catch(() => []))
    ).finally(() => setLoaded(true));
  }, [products, loadProductReviews]);

  const mine = reviews.filter(
    (r) => String(r.userId) === String(user.id)
  );

  return (
    <div className="container py-4">
      <h2>My Reviews</h2>

      {!loaded && <p>Loading reviews...</p>}

      {mine.map((r) => {
        const p = products.find(
          (x) => String(x.id) === String(r.productId)
        );

        return (
          <div className="card mb-2" key={r.id}>
            <div className="card-body">
              <Link to={`/products/${r.productId}`}>
                <h5>{p?.name || "Product"}</h5>
              </Link>

              <div className="text-warning">
                {"★".repeat(Number(r.rating))}
              </div>

              <p>{r.review}</p>

              <small>
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString()
                  : ""}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
