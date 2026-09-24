import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Reviews() {
  const user = useSelector((state) => state.auth.user);

  const reviews = useSelector((state) => state.reviews.items);

  const products = useSelector((state) => state.products.items);

  const myReviews = reviews.filter(
    (r) => r.userId === user.id,
  );

  return (
    <div className="reviews-page">
      <div className="container">
        <header className="reviews-header">
          <div>
            <div className="reviews-eyebrow">
              YOUR FEEDBACK
            </div>

            <h1 className="reviews-title">
              My Reviews
            </h1>

            <p className="reviews-subtitle">
              View the feedback you've shared about your purchases.
            </p>
          </div>

          <div className="reviews-count">
            {myReviews.length}{" "}
            {myReviews.length === 1 ? "review" : "reviews"}
          </div>
        </header>

        {myReviews.length === 0 && (
          <div className="reviews-empty">
            <div className="reviews-empty-icon">
              <i className="bi bi-star" />
            </div>

            <div className="reviews-empty-eyebrow">
              YOUR REVIEWS
            </div>

            <h2>No reviews yet</h2>

            <p>
              Reviews you leave on products will appear here.
            </p>

            <Link
              to="/products"
              className="reviews-primary-button"
            >
              Browse Products
              <i className="bi bi-arrow-right" />
            </Link>
          </div>
        )}

        {myReviews.length > 0 && (
          <section className="reviews-list">
            <div className="reviews-list-header">
              <div>
                <div className="reviews-list-eyebrow">
                  REVIEW HISTORY
                </div>

                <h2>Your Product Reviews</h2>
              </div>

              <span>{myReviews.length}</span>
            </div>

            {myReviews.map((r) => {
              const p = products.find(
                (x) => x.id === r.productId,
              );

              return (
                <article
                  className="my-review-card"
                  key={r.id}
                >
                  <div className="my-review-product">
                    <div className="my-review-product-image">
                      {p?.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                        />
                      ) : (
                        <i className="bi bi-image" />
                      )}
                    </div>

                    <div className="my-review-product-info">
                      <div className="my-review-label">
                        PRODUCT REVIEW
                      </div>

                      <Link
                        to={`/products/${r.productId}`}
                        className="my-review-product-name"
                      >
                        {p?.name || "Product"}
                        <i className="bi bi-arrow-up-right" />
                      </Link>

                      {p?.brand && (
                        <span className="my-review-brand">
                          {p.brand}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="my-review-divider" />

                  <div className="my-review-content">
                    <div className="my-review-rating">
                      <div className="my-review-stars">
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </div>

                      <span>
                        {r.rating}/5
                      </span>
                    </div>

                    <p className="my-review-text">
                      {r.review}
                    </p>

                    <div className="my-review-date">
                      <i className="bi bi-clock" />

                      {r.createdAt
                        ? new Date(
                            r.createdAt,
                          ).toLocaleString("en-IN")
                        : ""}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}