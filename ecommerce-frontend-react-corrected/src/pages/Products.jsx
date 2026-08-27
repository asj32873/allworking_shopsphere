import { useMemo, useState } from "react";
import ProductCard from "../components/products/ProductCard";
import { useApp } from "../context/AppContext";
export default function Products() {
  const { products } = useApp();
  const [q, setQ] = useState(""),
    [brand, setBrand] = useState(""),
    [cat, setCat] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [rating, setRating] = useState(""),
    [stock, setStock] = useState(""),
    [sort, setSort] = useState(""),
    [page, setPage] = useState(1);
  const brands = [...new Set(products.map((p) => p.brand))],
    cats = [...new Set(products.map((p) => p.category))];
  const filtered = useMemo(() => {
    let r = products.filter(
      (p) =>
        `${p.name} ${p.brand} ${p.description}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (!brand || p.brand === brand) &&
        (!cat || p.category === cat) &&
        (!min || p.price >= +min) &&
        (!max || p.price <= +max) &&
        (!rating || p.rating >= +rating) &&
        (!stock || (stock === "in" ? p.stock > 0 : p.stock === 0)),
    );
    if (sort === "low") r.sort((a, b) => a.price - b.price);
    if (sort === "high") r.sort((a, b) => b.price - a.price);
    if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [products, q, brand, cat, min, max, rating, stock, sort]);
  const size = 9,
    total = Math.max(1, Math.ceil(filtered.length / size)),
    items = filtered.slice((page - 1) * size, page * size);
  const change = (fn, v) => {
    fn(v);
    setPage(1);
  };
  return (
    <div className="container py-4">
      <div className="row g-4 product-grid">
        <div className="col-lg-3">
          <div className="card">
            <div className="card-body">
              <h5>Filters</h5>
              <input
                className="form-control mt-3"
                placeholder="Search"
                value={q}
                onChange={(e) => change(setQ, e.target.value)}
              />
              <select
                className="form-select mt-3"
                value={brand}
                onChange={(e) => change(setBrand, e.target.value)}
              >
                <option value="">All brands</option>
                {brands.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <select
                className="form-select mt-3"
                value={cat}
                onChange={(e) => change(setCat, e.target.value)}
              >
                <option value="">All categories</option>
                {cats.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <div className="row g-2">
                <div className="col">
                  <input
                    type="number"
                    className="form-control mt-3"
                    placeholder="Min ₹"
                    value={min}
                    onChange={(e) => change(setMin, e.target.value)}
                  />
                </div>
                <div className="col">
                  <input
                    type="number"
                    className="form-control mt-3"
                    placeholder="Max ₹"
                    value={max}
                    onChange={(e) => change(setMax, e.target.value)}
                  />
                </div>
              </div>
              <select
                className="form-select mt-3"
                value={rating}
                onChange={(e) => change(setRating, e.target.value)}
              >
                <option value="">Any rating</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
              <select
                className="form-select mt-3"
                value={stock}
                onChange={(e) => change(setStock, e.target.value)}
              >
                <option value="">All availability</option>
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <select
                className="form-select mt-3"
                value={sort}
                onChange={(e) => change(setSort, e.target.value)}
              >
                <option value="">Default</option>
                <option value="low">Price low → high</option>
                <option value="high">Price high → low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>
        <div className="col-lg-9">
          <div className="d-flex justify-content-between">
            <h2>Products</h2>
            <span>{filtered.length} results</span>
          </div>
          <div className="row g-4">
            {items.map((p) => (
              <div className="col-md-6 col-xl-4" key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
          {!items.length && (
            <div className="alert alert-info mt-3">
              No products match your filters.
            </div>
          )}
          {total > 1 && (
            <nav className="mt-4">
              <ul className="pagination">
                {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
                  <li
                    className={`page-item ${page === n ? "active" : ""}`}
                    key={n}
                  >
                    <button className="page-link" onClick={() => setPage(n)}>
                      {n}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
