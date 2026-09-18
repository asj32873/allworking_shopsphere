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
      <div className="py-4">
        <h2>{existing ? "Edit Product" : "Create Product"}</h2>

        <form className="card card-body row g-3" onSubmit={submit}>
          {["name", "brand", "price", "stock", "image"].map((key) => (
            <div className="col-md-6" key={key}>
              <input
                className="form-control"
                name={key}
                placeholder={key}
                type={key === "price" || key === "stock" ? "number" : "text"}
                required={key !== "image"}
                value={f[key]}
                onChange={(e) =>
                  setF({
                    ...f,
                    [key]: e.target.value,
                  })
                }
              />
            </div>
          ))}

          <div className="col-md-6">
            <select
              className="form-select"
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

          <div className="col-12">
            <textarea
              className="form-control"
              rows="4"
              placeholder="description"
              required
              value={f.description}
              onChange={(e) =>
                setF({
                  ...f,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div>
            <button className="btn btn-primary" type="submit">
              {existing ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
