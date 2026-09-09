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

  const p = products.find((x) => String(x.id || x._id) === String(id));

  const vendor = p?.vendor;
  const [qty, setQty] = useState(1);

  if (!p) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Product not found.</div>
      </div>
    );
  }

  const productId = p.id || p._id;
  const userId = user?.id || user?._id;

  const mine = reviews.filter((r) => String(r.productId) === String(productId));

  const purchased = orders.some((o) => {
    const orderUserId = o.userId?.id || o.userId?._id || o.userId;
    const items = o.items || [];

    return (
      String(orderUserId) === String(userId) &&
      o.status === "DELIVERED" &&
      items.some(
        (i) =>
          String(i.productId?.id || i.productId?._id || i.productId) ===
          String(productId),
      )
    );
  });

  const myReview = reviews.find(
    (r) =>
      String(r.productId) === String(productId) &&
      String(r.userId) === String(userId),
  );

  const canReview = user?.role === "USER" && purchased;

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
                onClick={() =>
                  dispatch(
                    addToCart({
                      productId: p.id || p._id,
                      quantity: qty,
                    }),
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

          <div className="card mt-3">
            <div className="card-body">
              <h5>Sold By</h5>
              {vendor?.storeName || "Unknown vendor"}
            </div>
          </div>

          <ProductQA productId={productId} />
        </div>
      </div>

      <section className="mt-5">
        <h3>Reviews</h3>

        {mine.length === 0 && <p className="text-muted">No reviews yet.</p>}

        {mine.map((r) => (
          <div className="card mb-2" key={r.id || r._id}>
            <div className="card-body">
              <div className="text-warning">{"★".repeat(r.rating)}</div>

              <p>{r.review}</p>

              <small>{new Date(r.createdAt).toLocaleString()}</small>
            </div>
          </div>
        ))}

        {canReview && !myReview && <ReviewForm productId={productId} />}

        {myReview && (
          <ReviewForm productId={productId} existingReview={myReview} />
        )}

        {user?.role === "USER" && !purchased && (
          <div className="alert alert-info mt-3">
            You can review this product after purchasing it and receiving a
            delivered order.
          </div>
        )}
      </section>
    </div>
  );
}
