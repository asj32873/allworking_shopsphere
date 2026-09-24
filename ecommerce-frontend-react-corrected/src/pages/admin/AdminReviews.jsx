import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { deleteReview } from "../../store/slices/reviewSlice";

export default function AdminReviews() {
  const dispatch = useDispatch();

  const reviews = useSelector((state) => state.reviews.items);

  const products = useSelector((state) => state.products.items);

  return (
    <PortalLayout type="admin">
      <div className="admin-reviews-page">
        <div className="admin-reviews-header">
          <div>
            <div className="admin-reviews-eyebrow">CONTENT MODERATION</div>

            <h1 className="admin-reviews-title">Review Moderation</h1>

            <p className="admin-reviews-subtitle">
              Review customer feedback and remove inappropriate or unwanted
              content.
            </p>
          </div>

          <div className="admin-reviews-summary">
            <span className="admin-reviews-summary-value">
              {reviews.length}
            </span>

            <span className="admin-reviews-summary-label">
              {reviews.length === 1 ? "Review" : "Reviews"}
            </span>
          </div>
        </div>

        <div className="admin-reviews-card">
          <div className="admin-reviews-card-header">
            <div>
              <div className="admin-reviews-card-eyebrow">
                CUSTOMER FEEDBACK
              </div>

              <h2 className="admin-reviews-card-title">
                Published Reviews
              </h2>
            </div>

            <span className="admin-reviews-count">
              {reviews.length}
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="admin-reviews-empty">
              <div className="admin-reviews-empty-icon">
                <i className="bi bi-chat-square-text" />
              </div>

              <div className="admin-reviews-empty-eyebrow">
                NO REVIEWS
              </div>

              <h3>No customer reviews yet</h3>

              <p>
                Reviews submitted by customers will appear here for
                moderation.
              </p>
            </div>
          ) : (
            <div className="admin-reviews-list">
              {reviews.map((r) => {
                const product = products.find(
                  (p) => String(p.id) === String(r.productId),
                );

                return (
                  <div className="admin-review-card" key={r.id}>
                    <div className="admin-review-top">
                      <div className="admin-review-product">
                        <div className="admin-review-product-icon">
                          <i className="bi bi-box-seam" />
                        </div>

                        <div>
                          <div className="admin-review-eyebrow">
                            PRODUCT REVIEW
                          </div>

                          <h3 className="admin-review-product-name">
                            {product?.name || "Unknown Product"}
                          </h3>
                        </div>
                      </div>

                      <div className="admin-review-rating">
                        <div className="admin-review-stars">
                          {"★".repeat(r.rating)}
                        </div>

                        <span className="admin-review-rating-value">
                          {r.rating}/5
                        </span>
                      </div>
                    </div>

                    <div className="admin-review-divider" />

                    <div className="admin-review-content">
                      <div className="admin-review-content-label">
                        CUSTOMER COMMENT
                      </div>

                      <p>{r.review}</p>
                    </div>

                    <div className="admin-review-footer">
                      <div className="admin-review-id">
                        <i className="bi bi-hash" />
                        <span>{r.id}</span>
                      </div>

                      <button
                        type="button"
                        className="admin-review-delete"
                        onClick={() => dispatch(deleteReview(r.id))}
                      >
                        <i className="bi bi-trash3" />
                        Delete Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}