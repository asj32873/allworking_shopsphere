import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import ProductCard from "../components/products/ProductCard";

export default function Home() {
  const products = useSelector((state) => state.products.items);

  const featuredProducts = products.slice(0, 4);

  const heroProduct = products[0];

  return (
    <main className="shopsphere-home">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="home-hero">
        <div className="container">
          <div className="home-hero-content">
            <div className="home-hero-copy">
              <div className="home-eyebrow">
                <span className="home-eyebrow-dot" />
                ShopSphere marketplace
              </div>

              <h1 className="home-hero-title">
                Discover products from
                <span> trusted vendors.</span>
              </h1>

              <p className="home-hero-description">
                Explore products, compare what you need, and shop from
                multiple vendors through one simple marketplace.
              </p>

              <div className="home-hero-actions">
                <Link to="/products" className="home-primary-button">
                  Explore products
                  <i className="bi bi-arrow-right" />
                </Link>

                <Link to="/vendor/register" className="home-secondary-button">
                  Become a vendor
                </Link>
              </div>

              <div className="home-hero-meta">
                <div className="home-hero-meta-item">
                  <i className="bi bi-grid" />
                  <span>Multi-vendor marketplace</span>
                </div>

                <div className="home-hero-meta-item">
                  <i className="bi bi-box-seam" />
                  <span>Browse available products</span>
                </div>
              </div>
            </div>

            {/* Hero product visual */}
            <div className="home-hero-visual">
              <div className="home-hero-glow" />

              <div className="home-product-preview">
                <div className="home-product-preview-top">
                  <span>Featured product</span>

                  <span className="home-preview-status">
                    <span />
                    Available
                  </span>
                </div>

                <div className="home-product-preview-image">
                  {heroProduct?.image ? (
                    <img
                      src={heroProduct.image}
                      alt={heroProduct.name}
                    />
                  ) : (
                    <div className="home-product-preview-placeholder">
                      <i className="bi bi-image" />
                    </div>
                  )}
                </div>

                <div className="home-product-preview-info">
                  <div className="home-product-preview-category">
                    {heroProduct?.brand || "ShopSphere"}
                    {heroProduct?.category && (
                      <>
                        <span>·</span>
                        {heroProduct.category}
                      </>
                    )}
                  </div>

                  <h2>
                    {heroProduct?.name || "Explore our products"}
                  </h2>

                  {heroProduct && (
                    <div className="home-product-preview-bottom">
                      <strong>
                        ₹{heroProduct.price.toLocaleString("en-IN")}
                      </strong>

                      <span>
                        <i className="bi bi-star-fill" />
                        {Number(heroProduct.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="home-floating-card home-floating-card-top">
                <i className="bi bi-search" />

                <div>
                  <strong>Find what you need</strong>
                  <span>Browse the catalog</span>
                </div>
              </div>

              <div className="home-floating-card home-floating-card-bottom">
                <i className="bi bi-cart3" />

                <div>
                  <strong>Ready to shop?</strong>
                  <span>Explore products</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DISCOVERY STRIP
      ===================================================== */}

      <section className="home-discovery">
        <div className="container">
          <div className="home-discovery-grid">
            <div className="home-discovery-item">
              <div className="home-discovery-icon">
                <i className="bi bi-shop" />
              </div>

              <div>
                <strong>Multiple vendors</strong>
                <span>Discover products from different stores</span>
              </div>
            </div>

            <div className="home-discovery-item">
              <div className="home-discovery-icon">
                <i className="bi bi-funnel" />
              </div>

              <div>
                <strong>Easy discovery</strong>
                <span>Search and filter the product catalog</span>
              </div>
            </div>

            <div className="home-discovery-item">
              <div className="home-discovery-icon">
                <i className="bi bi-bag-check" />
              </div>

              <div>
                <strong>Simple shopping</strong>
                <span>Add products to your cart and checkout</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          POPULAR PRODUCTS
      ===================================================== */}

      <section className="home-products">
        <div className="container">
          <div className="home-section-header">
            <div>
              <span className="home-section-eyebrow">
                Explore the catalog
              </span>

              <h2>Popular products</h2>

              <p>
                Start with some of the products currently available on
                ShopSphere.
              </p>
            </div>

            <Link to="/products" className="home-section-link">
              View all
              <i className="bi bi-arrow-right" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="row g-4 product-grid">
              {featuredProducts.map((product) => (
                <div className="col-sm-6 col-lg-3" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="home-empty-products">
              <div className="home-empty-icon">
                <i className="bi bi-box-seam" />
              </div>

              <h3>No products available yet</h3>

              <p>
                Products will appear here when they become available.
              </p>

              <Link to="/products" className="home-primary-button">
                Browse products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          MARKETPLACE CTA
      ===================================================== */}

      <section className="home-marketplace-cta">
        <div className="container">
          <div className="home-cta-inner">
            <div>
              <span className="home-section-eyebrow">
                ShopSphere
              </span>

              <h2>Ready to explore?</h2>

              <p>
                Browse the full catalog and find products from our
                marketplace.
              </p>
            </div>

            <Link to="/products" className="home-cta-button">
              Browse products
              <i className="bi bi-arrow-up-right" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}