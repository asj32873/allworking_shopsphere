import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ProductQA from "../components/products/ProductQA";
import ReviewForm from "../components/products/ReviewForm";

export default function ProductDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const { products, reviews, orders, addToCart, user } = useApp();

  const p = products.find((x) => String(x.id) === String(id));

  const vendor = p?.vendor;
  const [qty, setQty] = useState(1);

  if (!p) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Product not found.</div>
      </div>
    );
  }

  const mine = reviews.filter((r) => r.productId === p.id);

  const purchased = orders.some(
    (o) =>
      String(o.userId) === String(user.id) &&
      o.status === "DELIVERED" &&
      o.items.some((i) => String(i.productId) === String(p.id)),
  );

  const myReview = reviews.find(
    (r) =>
      String(r.productId) === String(p.id) &&
      String(r.userId) === String(user.id),
  );

  const canReview = user?.role === "USER" && purchased;

  return (
    <div className="container py-4">
      <Link to="/products">← Back</Link>

      <div className="row g-5 mt-1">
        {/* Product Image */}
        <div className="col-lg-6">
          <img
            src={p.image}
            className="img-fluid rounded product-detail-image"
            alt={p.name}
          />
        </div>

        {/* Product Details */}
        <div className="col-lg-6">
          <small className="text-muted">
            {p.brand} · {p.category}
          </small>

          <h1>{p.name}</h1>

          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-warning">
              ★ {Number(p.rating || 0).toFixed(1)}
            </span>

            <span className="text-muted">
              {p.reviewCount || 0} {p.reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>

          <h3 className="mt-3">₹{p.price.toLocaleString("en-IN")}</h3>

          <p>{p.description}</p>

          <p>
            <strong>Stock:</strong> {p.stock || "Out of stock"}
          </p>

          {/* Cart / Buy Actions */}
          {user?.role === "USER" && (
            <div className="d-flex gap-2">
              <input
                type="number"
                min="1"
                max={p.stock}
                className="form-control"
                style={{ width: 90 }}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(+e.target.value || 1, p.stock)))
                }
              />

              <button
                className="btn btn-primary"
                disabled={!p.stock}
                onClick={() => addToCart(p, qty)}
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
          <div className="card mt-3">
            <div className="card-body">
              <h5>Sold By</h5>
              {vendor?.storeName || "Unknown vendor"}
            </div>
          </div>

          <ProductQA productId={p.id} />
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-5">
        <h3>Reviews</h3>

        {mine.map((r) => (
          <div className="card mb-2" key={r.id}>
            <div className="card-body">
              <div className="text-warning">{"★".repeat(r.rating)}</div>

              <p>{r.review}</p>

              <small>{r.createdAt}</small>
            </div>
          </div>
        ))}

        {canReview && !myReview && <ReviewForm productId={p.id} />}

        {myReview && <ReviewForm productId={p.id} existingReview={myReview} />}
      </section>
    </div>
  );
}
