import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import ProductCard from "../components/products/ProductCard";

export default function Products() {
  const products = useSelector((state) => state.products.items);

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [cat, setCat] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [rating, setRating] = useState("");
  const [stock, setStock] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);

  const brands = [...new Set(products.map((p) => p.brand))];

  const cats = [...new Set(products.map((p) => p.category))];

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

    if (sort === "low") {
      r.sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      r.sort((a, b) => b.price - a.price);
    }

    if (sort === "rating") {
      r.sort((a, b) => b.rating - a.rating);
    }

    return r;
  }, [products, q, brand, cat, min, max, rating, stock, sort]);

  const size = 9;

  const total = Math.max(1, Math.ceil(filtered.length / size));

  const items = filtered.slice((page - 1) * size, page * size);

  const change = (fn, value) => {
    fn(value);
    setPage(1);
  };

  return (
    <main className="products-page">
      {/* =====================================================
          CATALOG HEADER
      ===================================================== */}

      <section className="products-header">
        <div className="container">
          <div className="products-header-inner">
            <div>
              <span className="products-eyebrow">
                ShopSphere catalog
              </span>

              <h1>Products</h1>

              <p>
                Explore products from trusted vendors across the
                ShopSphere marketplace.
              </p>
            </div>

            <div className="products-result-summary">
              <strong>{filtered.length}</strong>
              <span>
                {filtered.length === 1 ? "product" : "products"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATALOG
      ===================================================== */}

      <section className="products-catalog">
        <div className="container">
          <div className="products-layout">
            {/* =================================================
                FILTERS
            ================================================= */}

            <aside className="products-filters">
              <div className="products-filters-header">
                <div>
                  <span className="products-filter-label">
                    Refine
                  </span>

                  <h2>Filters</h2>
                </div>

                <i className="bi bi-sliders" />
              </div>

              <div className="products-filter-group">
                <label htmlFor="product-search">
                  Search
                </label>

                <div className="products-search-field">
                  <i className="bi bi-search" />

                  <input
                    id="product-search"
                    type="search"
                    placeholder="Search products..."
                    value={q}
                    onChange={(e) =>
                      change(setQ, e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="products-filter-group">
                <label htmlFor="product-brand">
                  Brand
                </label>

                <select
                  id="product-brand"
                  value={brand}
                  onChange={(e) =>
                    change(setBrand, e.target.value)
                  }
                >
                  <option value="">All brands</option>

                  {brands.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="products-filter-group">
                <label htmlFor="product-category">
                  Category
                </label>

                <select
                  id="product-category"
                  value={cat}
                  onChange={(e) =>
                    change(setCat, e.target.value)
                  }
                >
                  <option value="">All categories</option>

                  {cats.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="products-filter-group">
                <label>Price range</label>

                <div className="products-price-fields">
                  <div className="products-price-field">
                    <span>₹</span>

                    <input
                      type="number"
                      placeholder="Min"
                      value={min}
                      onChange={(e) =>
                        change(setMin, e.target.value)
                      }
                    />
                  </div>

                  <div className="products-price-field">
                    <span>₹</span>

                    <input
                      type="number"
                      placeholder="Max"
                      value={max}
                      onChange={(e) =>
                        change(setMax, e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="products-filter-group">
                <label htmlFor="product-rating">
                  Rating
                </label>

                <select
                  id="product-rating"
                  value={rating}
                  onChange={(e) =>
                    change(setRating, e.target.value)
                  }
                >
                  <option value="">Any rating</option>
                  <option value="4">4+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>

              <div className="products-filter-group">
                <label htmlFor="product-stock">
                  Availability
                </label>

                <select
                  id="product-stock"
                  value={stock}
                  onChange={(e) =>
                    change(setStock, e.target.value)
                  }
                >
                  <option value="">All availability</option>
                  <option value="in">In stock</option>
                  <option value="out">Out of stock</option>
                </select>
              </div>
            </aside>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <div className="products-results">
              <div className="products-toolbar">
                <div className="products-toolbar-info">
                  <span className="products-toolbar-count">
                    Showing
                  </span>

                  <strong>
                    {items.length} of {filtered.length}
                  </strong>

                  <span className="products-toolbar-count">
                    products
                  </span>
                </div>

                <div className="products-sort">
                  <label htmlFor="product-sort">
                    Sort by
                  </label>

                  <select
                    id="product-sort"
                    value={sort}
                    onChange={(e) =>
                      change(setSort, e.target.value)
                    }
                  >
                    <option value="">Default</option>
                    <option value="low">
                      Price: low to high
                    </option>
                    <option value="high">
                      Price: high to low
                    </option>
                    <option value="rating">
                      Highest rated
                    </option>
                  </select>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="row g-4 products-grid">
                  {items.map((product) => (
                    <div
                      className="col-md-6 col-xl-4"
                      key={product.id}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="products-empty">
                  <div className="products-empty-icon">
                    <i className="bi bi-search" />
                  </div>

                  <h2>No products found</h2>

                  <p>
                    No products match your current filters.
                  </p>
                </div>
              )}

              {/* =================================================
                  PAGINATION
              ================================================= */}

              {total > 1 && (
                <nav
                  className="products-pagination"
                  aria-label="Product pagination"
                >
                  <button
                    type="button"
                    className="products-page-button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    aria-label="Previous page"
                  >
                    <i className="bi bi-chevron-left" />
                  </button>

                  <div className="products-page-numbers">
                    {Array.from(
                      { length: total },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <button
                        type="button"
                        className={`products-page-number ${
                          page === n ? "active" : ""
                        }`}
                        key={n}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="products-page-button"
                    disabled={page === total}
                    onClick={() => setPage(page + 1)}
                    aria-label="Next page"
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}