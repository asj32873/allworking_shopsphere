import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import ProductCard from "../components/products/ProductCard";

export default function Home() {
  const products = useSelector((state) => state.products.items);

  return (
    <>
      <section className="hero py-5">
        <div className="container py-5">
          <h1 className="display-5 fw-bold">
            Everything you need, from trusted vendors.
          </h1>

          <p className="lead">
            A complete multi-vendor e-commerce frontend built with React.
          </p>

          <Link to="/products" className="btn btn-light btn-lg">
            Shop Products
          </Link>
        </div>
      </section>

      <section className="container py-5">
        <div className="d-flex justify-content-between">
          <h2>Popular Products</h2>

          <Link to="/products">View all</Link>
        </div>

        <div className="row g-4 product-grid">
          {products.slice(0, 4).map((p) => (
            <div className="col-sm-6 col-lg-3" key={p.id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
