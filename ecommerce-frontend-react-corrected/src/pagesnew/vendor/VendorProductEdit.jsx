import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";

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

  const {
    products,
    user,
    addProduct,
    updateProduct,
  } = useApp();

  const existing = products.find(
    (p) =>
      String(p.id) === String(productId) &&
      String(p.vendorId) === String(user.id)
  );

  const [f, setF] = useState(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existing) {
      setF({
        name: existing.name,
        brand: existing.brand,
        category: existing.category,
        price: existing.price,
        stock: existing.stock,
        description: existing.description,
        image: existing.image || "",
      });
    }
  }, [existing]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = {
        ...f,
        price: Number(f.price),
        stock: Number(f.stock),
      };

      if (existing) await updateProduct(existing.id, data);
      else await addProduct(data);

      nav("/vendor/products");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <PortalLayout type="vendor">
      <div className="py-4">
        <h2>{existing ? "Edit" : "Create"} Product</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form
          className="card card-body row g-3"
          onSubmit={submit}
        >
          {["name", "brand", "price", "stock", "image"].map((k) => (
            <div className="col-md-6" key={k}>
              <input
                className="form-control"
                name={k}
                placeholder={k}
                required={k !== "image"}
                value={f[k]}
                onChange={(e) =>
                  setF({ ...f, [k]: e.target.value })
                }
              />
            </div>
          ))}

          <div className="col-md-6">
            <select
              className="form-select"
              value={f.category}
              onChange={(e) =>
                setF({ ...f, category: e.target.value })
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
              ].map((x) => (
                <option key={x}>{x}</option>
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
                setF({ ...f, description: e.target.value })
              }
            />
          </div>

          <div>
            <button className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
