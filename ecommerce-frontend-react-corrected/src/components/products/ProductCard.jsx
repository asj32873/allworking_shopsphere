import { Link } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import Tilt3D from "../../common/tilt3d";

export default function ProductCard({ product }) {
  const { addToCart, user } = useApp();
  const [error, setError] = useState("");
  const add = async () => {
    try {
      setError("");
      await addToCart(product);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Tilt3D max={7}>
      <div className="card h-100 card-hover">
        <img
          src={product.image}
          className="card-img-top product-img"
          alt={product.name}
        />
        <div className="card-body d-flex flex-column">
          <small className="text-muted">
            {product.brand} · {product.category}
          </small>
          <h5 className="mt-1">{product.name}</h5>
          <p className="small text-muted flex-grow-1">{product.description}</p>
          <div className="d-flex justify-content-between align-items-center">
            <strong className="price fs-5">
              ₹{product.price.toLocaleString("en-IN")}
            </strong>
            <div className="text-end">
              <span className="badge text-bg-warning">
                ★ {Number(product.rating || 0).toFixed(1)}
              </span>
              <div className="small text-muted">
                {product.reviewCount || 0} reviews
              </div>
            </div>
          </div>
          <small className={product.stock ? "text-success" : "text-danger"}>
            {product.stock ? `In stock (${product.stock})` : "Out of stock"}
          </small>
          {error && <small className="text-danger mt-1">{error}</small>}
          <div className="d-flex gap-2 mt-2">
            <Link
              className="btn btn-outline-primary flex-grow-1"
              to={`/products/${product.id}`}
            >
              View
            </Link>
            {user?.role === "USER" && (
              <button
                className="btn btn-primary"
                disabled={!product.stock}
                onClick={add}
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </Tilt3D>
  );
}
