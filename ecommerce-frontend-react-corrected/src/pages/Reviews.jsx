import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
export default function Reviews() {
  const { user, reviews, products } = useApp();
  return (
    <div className="container py-4">
      <h2>My Reviews</h2>
      {reviews
        .filter((r) => r.userId === user.id)
        .map((r) => {
          const p = products.find((x) => x.id === r.productId);
          return (
            <div className="card mb-2" key={r.id}>
              <div className="card-body">
                <Link to={`/products/${r.productId}`}>
                  <h5>{p?.name}</h5>
                </Link>
                <div className="text-warning">{"★".repeat(r.rating)}</div>
                <p>{r.review}</p>
                <small>{r.createdAt}</small>
              </div>
            </div>
          );
        })}
    </div>
  );
}
