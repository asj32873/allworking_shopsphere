import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { addProduct, updateProduct } from "../../store/slices/productSlice";

const empty = {
  name: "",
  brand: "",
  category: "ACCESSORIES",
  price: "",
  stock: "",
  description: "",
  image: "",
};

export default function VendorProductEdit() {
  const { productId } = useParams();

  const nav = useNavigate();
  const dispatch = useDispatch();

  const products = useSelector((state) => state.products.items);

  const user = useSelector((state) => state.auth.user);

  const existing = products.find(
    (p) =>
      String(p.id) === String(productId) &&
      String(p.vendorId) === String(user?.id),
  );

  const [f, setF] = useState(empty);

  useEffect(() => {
    if (existing) {
      setF({
        name: existing.name || "",
        brand: existing.brand || "",
        category: existing.category || "ACCESSORIES",
        price: existing.price ?? "",
        stock: existing.stock ?? "",
        description: existing.description || "",
        image: existing.image || "",
      });
    }
  }, [existing]);

  const submit = async (e) => {
    e.preventDefault();

    const data = {
      ...f,
      price: Number(f.price),
      stock: Number(f.stock),
    };

    try {
      if (existing) {
        await dispatch(
          updateProduct({
            id: existing.id,
            data,
          }),
        ).unwrap();
      } else {
        await dispatch(addProduct(data)).unwrap();
      }

      nav("/vendor/products");
    } catch (error) {
      console.error("Product save error:", error);

      alert(error?.message || "Failed to save product.");
    }
  };

  return (
    <PortalLayout type="vendor">
      <div className="vendor-product-edit-page">
        <header className="vendor-product-edit-header">
          <div>
            <div className="vendor-product-edit-eyebrow">
              VENDOR CATALOG
            </div>

            <h1 className="vendor-product-edit-title">
              {existing ? "Edit Product" : "Create Product"}
            </h1>

            <p className="vendor-product-edit-subtitle">
              {existing
                ? "Update your product information, pricing, inventory, and listing details."
                : "Add a new product to your vendor catalog."}
            </p>
          </div>

          <button
            type="button"
            className="vendor-product-edit-back"
            onClick={() => nav("/vendor/products")}
          >
            <i className="bi bi-arrow-left" />
            Back to Products
          </button>
        </header>

        <form
          className="vendor-product-form-card"
          onSubmit={submit}
        >
          <div className="vendor-product-form-header">
            <div className="vendor-product-form-icon">
              <i className="bi bi-box-seam" />
            </div>

            <div>
              <div className="vendor-product-form-eyebrow">
                PRODUCT DETAILS
              </div>

              <h2 className="vendor-product-form-title">
                {existing ? "Update listing" : "New listing"}
              </h2>

              <p className="vendor-product-form-description">
                Enter the information customers will see for this product.
              </p>
            </div>
          </div>

          <div className="vendor-product-form-section">
            <div className="vendor-product-form-section-title">
              Basic Information
            </div>

            <div className="vendor-product-form-grid">
              <div className="vendor-product-field">
                <label htmlFor="product-name">
                  Product Name
                </label>

                <input
                  id="product-name"
                  className="vendor-product-input"
                  name="name"
                  placeholder="e.g. Smart TV"
                  type="text"
                  required
                  value={f.name}
                  onChange={(e) =>
                    setF({
                      ...f,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="vendor-product-field">
                <label htmlFor="product-brand">
                  Brand
                </label>

                <input
                  id="product-brand"
                  className="vendor-product-input"
                  name="brand"
                  placeholder="e.g. Sony"
                  type="text"
                  required
                  value={f.brand}
                  onChange={(e) =>
                    setF({
                      ...f,
                      brand: e.target.value,
                    })
                  }
                />
              </div>

              <div className="vendor-product-field">
                <label htmlFor="product-category">
                  Category
                </label>

                <select
                  id="product-category"
                  className="vendor-product-input"
                  value={f.category}
                  onChange={(e) =>
                    setF({
                      ...f,
                      category: e.target.value,
                    })
                  }
                >
                  {[
                    "ELECTRONICS",
                    "MOBILE",
                    "LAPTOP",
                    "AUDIO",
                    "TV",
                    "HOME_APPLIANCES",
                    "ACCESSORIES",
                    "OTHER",
                  ].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="vendor-product-field">
                <label htmlFor="product-image">
                  Image URL
                  <span>Optional</span>
                </label>

                <input
                  id="product-image"
                  className="vendor-product-input"
                  name="image"
                  placeholder="https://..."
                  type="text"
                  value={f.image}
                  onChange={(e) =>
                    setF({
                      ...f,
                      image: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="vendor-product-form-divider" />

          <div className="vendor-product-form-section">
            <div className="vendor-product-form-section-title">
              Pricing & Inventory
            </div>

            <div className="vendor-product-form-grid">
              <div className="vendor-product-field">
                <label htmlFor="product-price">
                  Price
                </label>

                <div className="vendor-product-input-prefix">
                  <span>₹</span>

                  <input
                    id="product-price"
                    className="vendor-product-input vendor-product-input-with-prefix"
                    name="price"
                    placeholder="0"
                    type="number"
                    required
                    value={f.price}
                    onChange={(e) =>
                      setF({
                        ...f,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="vendor-product-field">
                <label htmlFor="product-stock">
                  Stock Quantity
                </label>

                <input
                  id="product-stock"
                  className="vendor-product-input"
                  name="stock"
                  placeholder="0"
                  type="number"
                  required
                  value={f.stock}
                  onChange={(e) =>
                    setF({
                      ...f,
                      stock: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="vendor-product-form-divider" />

          <div className="vendor-product-form-section">
            <div className="vendor-product-form-section-title">
              Description
            </div>

            <div className="vendor-product-field">
              <label htmlFor="product-description">
                Product Description
              </label>

              <textarea
                id="product-description"
                className="vendor-product-textarea"
                rows="5"
                placeholder="Describe the product, its features, and what customers should know."
                required
                value={f.description}
                onChange={(e) =>
                  setF({
                    ...f,
                    description: e.target.value,
                  })
                }
              />

              <div className="vendor-product-field-hint">
                Provide clear information about the product for customers.
              </div>
            </div>
          </div>

          <div className="vendor-product-form-footer">
            <button
              type="button"
              className="vendor-product-cancel-button"
              onClick={() => nav("/vendor/products")}
            >
              Cancel
            </button>

            <button
              className="vendor-product-submit-button"
              type="submit"
            >
              <i
                className={`bi ${
                  existing ? "bi-check-lg" : "bi-plus-lg"
                }`}
              />

              {existing ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}