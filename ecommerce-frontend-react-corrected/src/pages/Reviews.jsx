import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
export default function Reviews() {
  const user = useSelector((state) => state.auth.user);

  const reviews = useSelector((state) => state.reviews.items);

  const products = useSelector((state) => state.products.items);
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
