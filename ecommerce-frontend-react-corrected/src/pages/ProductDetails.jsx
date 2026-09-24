import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { addToCart } from "../store/slices/cartSlice";
import ProductQA from "../components/products/ProductQA";
import ReviewForm from "../components/products/ReviewForm";

export default function ProductDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const dispatch = useDispatch();

  const products = useSelector((state) => state.products.items);
  const reviews = useSelector((state) => state.reviews.items);
  const orders = useSelector((state) => state.orders.items);
  const user = useSelector((state) => state.auth.user);

  const p = products.find(
    (x) => String(x.id || x._id) === String(id)
  );

  const vendor = p?.vendor;
  const [qty, setQty] = useState(1);

  if (!p) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Product not found.
        </div>
      </div>
    );
  }

  const productId = p.id || p._id;
  const userId = user?.id || user?._id;

  const mine = reviews.filter(
    (r) => String(r.productId) === String(productId)
  );

  const purchased = orders.some((o) => {
    const orderUserId =
      o.userId?.id || o.userId?._id || o.userId;

    const items = o.items || [];

    return (
      String(orderUserId) === String(userId) &&
      o.status === "DELIVERED" &&
      items.some(
        (i) =>
          String(
            i.productId?.id ||
              i.productId?._id ||
              i.productId
          ) === String(productId)
      )
    );
  });

  const myReview = reviews.find(
    (r) =>
      String(r.productId) === String(productId) &&
      String(r.userId) === String(userId)
  );

  const canReview = user?.role === "USER" && purchased;

  return (
    <div className="product-detail-page">
      <div className="container py-4">

        {/* Back */}
        <Link
          to="/products"
          className="product-detail-back"
        >
          ← Back
        </Link>

        {/* Main Product */}
        <div className="row g-5 mt-1 product-detail-layout">

          {/* Product Image */}
          <div className="col-lg-6">
            <div className="product-detail-image-wrap">
              <img
                src={p.image}
                className="product-detail-image"
                alt={p.name}
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="col-lg-6">
            <div className="product-detail-info">

              {/* Brand / Category */}
              <div className="product-detail-meta">
                {p.brand} · {p.category}
              </div>

              {/* Product Name */}
              <h1 className="product-detail-title">
                {p.name}
              </h1>

              {/* Rating */}
              <div className="product-detail-rating-row">
                <span className="product-detail-rating">
                  ★ {Number(p.rating || 0).toFixed(1)}
                </span>

                <span className="product-detail-review-count">
                  {p.reviewCount || 0}{" "}
                  {p.reviewCount === 1
                    ? "review"
                    : "reviews"}
                </span>
              </div>

              {/* Price */}
              <h3 className="product-detail-price">
                ₹{p.price.toLocaleString("en-IN")}
              </h3>

              {/* Description */}
              <p className="product-detail-description">
                {p.description}
              </p>

              {/* Stock */}
              <div className="product-detail-stock">
                <span className="product-detail-stock-dot" />

                <span>
                  <strong>Stock:</strong>{" "}
                  {p.stock || "Out of stock"}
                </span>
              </div>

              {/* Cart / Buy Actions */}
              {user?.role === "USER" && (
                <div className="product-detail-actions">

                  <input
                    type="number"
                    min="1"
                    max={p.stock}
                    className="form-control product-detail-quantity"
                    value={qty}
                    onChange={(e) =>
                      setQty(
                        Math.max(
                          1,
                          Math.min(
                            +e.target.value || 1,
                            p.stock
                          )
                        )
                      )
                    }
                  />

                  <button
                    className="btn btn-primary"
                    disabled={!p.stock}
                    onClick={() =>
                      dispatch(
                        addToCart({
                          productId:
                            p.id || p._id,
                          quantity: qty,
                        })
                      )
                    }
                  >
                    Add to Cart
                  </button>

                  <button
                    className="btn btn-success"
                    disabled={!p.stock}
                    onClick={() => {
                      addToCart(p, qty);
                      nav("/cart");
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              )}

              {/* Vendor */}
              <div className="product-detail-vendor">
                <div className="product-detail-vendor-label">
                  Sold By
                </div>

                <div className="product-detail-vendor-name">
                  {vendor?.storeName || "Unknown vendor"}
                </div>
              </div>

              {/* Q&A */}
              <div className="product-detail-qa">
                <ProductQA productId={productId} />
              </div>

            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="product-detail-reviews">

          <div className="product-detail-reviews-header">
            <h3 className="product-detail-reviews-title">
              Reviews
            </h3>
          </div>

          {/* Empty State */}
          {mine.length === 0 && (
            <div className="product-detail-review-empty">
              No reviews yet.
            </div>
          )}

          {/* Existing Reviews */}
          {mine.map((r) => (
            <div
              className="card review-card"
              key={r.id || r._id}
            >
              <div className="card-body">

                <div className="text-warning">
                  {"★".repeat(r.rating)}
                </div>

                <p className="mb-2">
                  {r.review}
                </p>

                <small className="text-muted">
                  {new Date(
                    r.createdAt
                  ).toLocaleString()}
                </small>

              </div>
            </div>
          ))}

          {/* New Review */}
          {canReview && !myReview && (
            <div className="product-detail-review-form">
              <ReviewForm productId={productId} />
            </div>
          )}

          {/* Existing User Review */}
          {myReview && (
            <div className="product-detail-review-form">
              <ReviewForm
                productId={productId}
                existingReview={myReview}
              />
            </div>
          )}

          {/* Review Eligibility Message */}
          {user?.role === "USER" && !purchased && (
            <div className="alert alert-info mt-3">
              You can review this product after purchasing it
              and receiving a delivered order.
            </div>
          )}

        </section>

      </div>
    </div>
  );
}