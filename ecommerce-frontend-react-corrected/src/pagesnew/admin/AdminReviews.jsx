import { useEffect, useMemo } from "react";
import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";

export default function AdminReviews() {
  const {
    reviews,
    products,
    loadProductReviews,
    deleteReview,
  } = useApp();

  useEffect(() => {
    Promise.all(
      products.map((p) => loadProductReviews(p.id).catch(() => []))
    );
  }, [products, loadProductReviews]);

  const allReviews = useMemo(
    () =>
      reviews.filter((r) =>
        products.some(
          (p) => String(p.id) === String(r.productId)
        )
      ),
    [reviews, products]
  );

  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Review Moderation</h2>

        {allReviews.map((r) => (
          <div className="card mb-2" key={r.id}>
            <div className="card-body">
              <h5>
                {
                  products.find(
                    (p) => String(p.id) === String(r.productId)
                  )?.name
                }
              </h5>

              <div className="text-warning">
                {"★".repeat(Number(r.rating))}
              </div>

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
