import { Link } from "react-router-dom";
import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { addToCart } from "../../store/slices/cartSlice";

import Tilt3D from "../../common/tilt3d";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const [error, setError] = useState("");

  const add = async () => {
    try {
      setError("");

      await dispatch(
        addToCart({
          product,
          quantity: 1,
        }),
      ).unwrap();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Tilt3D max={7}>
      <article className="product-card">
        {/* Product image */}
        <Link
          to={`/products/${product.id}`}
          className="product-card-image-link"
          aria-label={`View ${product.name}`}
        >
          <div className="product-card-image-wrap">
            {product.image ? (
              <img
                src={product.image}
                className="product-card-image"
                alt={product.name}
              />
            ) : (
              <div className="product-card-image product-card-no-image">
                <i className="bi bi-image" />
                <span>No image available</span>
              </div>
            )}

            <div className="product-card-image-overlay" />

            {product.stock ? (
              <span className="product-card-stock-badge">
                <span className="product-card-stock-dot" />
                In stock
              </span>
            ) : (
              <span className="product-card-stock-badge product-card-stock-badge-out">
                Out of stock
              </span>
            )}
          </div>
        </Link>

        {/* Product information */}
        <div className="product-card-body">
          <div className="product-card-meta">
            <span>{product.brand}</span>
            <span className="product-card-meta-separator">·</span>
            <span>{product.category}</span>
          </div>

          <Link
            to={`/products/${product.id}`}
            className="product-card-title-link"
          >
            <h3 className="product-card-title">{product.name}</h3>
          </Link>

          <p className="product-card-description">
            {product.description}
          </p>

          <div className="product-card-rating-row">
            <div className="product-card-rating">
              <i className="bi bi-star-fill" />
              <span>{Number(product.rating || 0).toFixed(1)}</span>
            </div>

            <span className="product-card-review-count">
              {product.reviewCount || 0}{" "}
              {product.reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="product-card-price-row">
            <strong className="product-card-price price">
              ₹{product.price.toLocaleString("en-IN")}
            </strong>
          </div>

          {!product.stock && (
            <div className="product-card-out-of-stock">
              Currently unavailable
            </div>
          )}

          {error && (
            <div className="product-card-error">
              <i className="bi bi-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="product-card-actions">
            <Link
              className="product-card-view-button"
              to={`/products/${product.id}`}
            >
              View product
              <i className="bi bi-arrow-right" />
            </Link>

            {user?.role === "USER" && (
              <button
                className="product-card-add-button"
                disabled={!product.stock}
                onClick={add}
                type="button"
                aria-label={`Add ${product.name} to cart`}
              >
                <i className="bi bi-cart-plus" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </article>
    </Tilt3D>
  );
}