import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { deleteReview } from "../../store/slices/reviewSlice";

export default function AdminReviews() {
  const dispatch = useDispatch();

  const reviews = useSelector((state) => state.reviews.items);

  const products = useSelector((state) => state.products.items);

  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Review Moderation</h2>

        {reviews.map((r) => {
          const product = products.find(
            (p) => String(p.id) === String(r.productId),
          );

          return (
            <div className="card mb-2" key={r.id}>
              <div className="card-body">
                <h5>{product?.name || "Unknown Product"}</h5>

                <div className="text-warning">{"★".repeat(r.rating)}</div>

                <p>{r.review}</p>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => dispatch(deleteReview(r.id))}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </PortalLayout>
  );
}
