import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ProductQA from "../components/products/ProductQA";
import ReviewForm from "../components/products/ReviewForm";

export default function ProductDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    products,
    reviews,
    orders,
    addToCart,
    loadProductReviews,
    user,
  } = useApp();

  const p = products.find((x) => String(x.id) === String(id));
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) loadProductReviews(id).catch(() => {});
  }, [id, loadProductReviews]);

  if (!p) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Product not found.</div>
      </div>
    );
  }

  const mine = reviews.filter(
    (r) => String(r.productId) === String(p.id)
  );

  const can =
    user?.role === "USER" &&
    orders.some(
      (o) =>
        String(o.userId) === String(user.id) &&
        o.items.some((i) => String(i.productId) === String(p.id))
    );

  const add = async () => {
    try {
      setError("");
      await addToCart(p, qty);
    } catch (e) {
      setError(e.message);
    }
  };

  const buy = async () => {
    try {
      setError("");
      await addToCart(p, qty);
      nav("/cart");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container py-4">
      <Link to="/products">← Back</Link>

      <div className="row g-5 mt-1">
        <div className="col-lg-6">
          <img
            src={p.image}
            className="img-fluid rounded product-detail-image"
            alt={p.name}
          />
        </div>

        <div className="col-lg-6">
          <small className="text-muted">
            {p.brand} · {p.category}
          </small>

          <h1>{p.name}</h1>
          <span className="badge text-bg-warning">★ {p.rating}</span>

          <h3 className="mt-3">
            ₹{p.price.toLocaleString("en-IN")}
          </h3>

          <p>{p.description}</p>

          <p>
            <strong>Stock:</strong>{" "}
            {p.stock ? p.stock : "Out of stock"}
          </p>

          {error && <div className="alert alert-danger">{error}</div>}

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
                  setQty(
                    Math.max(
                      1,
                      Math.min(Number(e.target.value) || 1, p.stock)
                    )
                  )
                }
              />

              <button
                className="btn btn-primary"
                disabled={!p.stock}
                onClick={add}
              >
                Add to Cart
              </button>

              <button
                className="btn btn-success"
                disabled={!p.stock}
                onClick={buy}
              >
                Buy Now
              </button>
            </div>
          )}

          <div className="card mt-3">
            <div className="card-body">
              <h5>Sold By</h5>
              <span>Vendor</span>
            </div>
          </div>

          <ProductQA />
        </div>
      </div>

      <section className="mt-5">
        <h3>Reviews</h3>

        {mine.map((r) => (
          <div className="card mb-2" key={r.id}>
            <div className="card-body">
              <div className="text-warning">
                {"★".repeat(Number(r.rating))}
              </div>
              <p>{r.review}</p>
              <small>
                {r.userId?.name || "Customer"} ·{" "}
                {new Date(r.createdAt).toLocaleDateString()}
              </small>
            </div>
          </div>
        ))}

        {can && <ReviewForm productId={p.id} />}
      </section>
    </div>
  );
}
