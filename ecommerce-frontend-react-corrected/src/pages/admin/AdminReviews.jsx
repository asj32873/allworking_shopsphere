import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
export default function AdminReviews() {
  const { reviews, products, deleteReview } = useApp();
  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Review Moderation</h2>
        {reviews.map((r) => (
          <div className="card mb-2" key={r.id}>
            <div className="card-body">
              <h5>{products.find((p) => p.id === r.productId)?.name}</h5>
              <div className="text-warning">{"★".repeat(r.rating)}</div>
              <p>{r.review}</p>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => deleteReview(r.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
