import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { deleteProduct } from "../../store/slices/productSlice";

export default function VendorProducts() {
  const dispatch = useDispatch();

  const products = useSelector((state) => state.products.items);

  const user = useSelector((state) => state.auth.user);

  const mine = products.filter(
    (p) =>
      String(p.vendorId) === String(user?.id) ||
      String(p.vendor?.userId) === String(user?.id),
  );

  return (
    <PortalLayout type="vendor">
      <div className="vendor-products-page">
        <header className="vendor-products-header">
          <div>
            <div className="vendor-products-eyebrow">
              VENDOR CATALOG
            </div>

            <h1 className="vendor-products-title">
              Product Management
            </h1>

            <p className="vendor-products-subtitle">
              Manage your products, pricing, inventory, and catalog listings.
            </p>
          </div>

          <Link
            className="vendor-products-add-button"
            to="/vendor/products/create"
          >
            <i className="bi bi-plus-lg" />
            Add Product
          </Link>
        </header>

        <section className="vendor-products-card">
          <div className="vendor-products-card-header">
            <div>
              <div className="vendor-products-card-eyebrow">
                YOUR PRODUCTS
              </div>

              <h2 className="vendor-products-card-title">
                Catalog
              </h2>
            </div>

            <div className="vendor-products-count">
              {mine.length} {mine.length === 1 ? "product" : "products"}
            </div>
          </div>

          {mine.length > 0 ? (
            <div className="vendor-products-table-wrap">
              <table className="vendor-products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {mine.map((p) => {
                    const lowStock = p.stock < 10;

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="vendor-product-name-cell">
                            <div className="vendor-product-icon">
                              <i className="bi bi-box-seam" />
                            </div>

                            <div>
                              <div className="vendor-product-name">
                                {p.name}
                              </div>

                              <div className="vendor-product-id">
                                Product #{p.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="vendor-product-price">
                            ₹{p.price.toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td>
                          <div className="vendor-product-stock">
                            <span
                              className={`vendor-product-stock-dot${
                                lowStock
                                  ? " vendor-product-stock-dot-low"
                                  : ""
                              }`}
                            />

                            <span>{p.stock}</span>

                            {lowStock && (
                              <span className="vendor-product-low-stock">
                                Low
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="vendor-product-actions">
                            <Link
                              className="vendor-product-edit"
                              to={`/vendor/products/${p.id}/edit`}
                            >
                              <i className="bi bi-pencil" />
                              Edit
                            </Link>

                            <button
                              className="vendor-product-delete"
                              onClick={() => dispatch(deleteProduct(p.id))}
                            >
                              <i className="bi bi-trash3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="vendor-products-empty">
              <div className="vendor-products-empty-icon">
                <i className="bi bi-box-seam" />
              </div>

              <div className="vendor-products-empty-eyebrow">
                EMPTY CATALOG
              </div>

              <h3>No products yet</h3>

              <p>
                Add your first product to start building your vendor catalog.
              </p>

              <Link
                to="/vendor/products/create"
                className="vendor-products-empty-button"
              >
                <i className="bi bi-plus-lg" />
                Add Product
              </Link>
            </div>
          )}
        </section>
      </div>
    </PortalLayout>
  );
}