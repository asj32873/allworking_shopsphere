import { Link } from "react-router-dom";
import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
export default function VendorProducts() {
  const { products, user, deleteProduct } = useApp();
  const mine = products.filter((p) => p.vendorId === user.id);
  return (
    <PortalLayout type="vendor">
      <div className="py-4">
        <div className="d-flex justify-content-between">
          <h2>Product Management</h2>
          <Link className="btn btn-primary" to="/vendor/products/create">
            Add Product
          </Link>
        </div>
        <div className="card mt-3">
          <div className="card-body table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>₹{p.price.toLocaleString("en-IN")}</td>
                    <td>{p.stock}</td>
                    <td>
                      <Link
                        className="btn btn-sm btn-outline-primary me-2"
                        to={`/vendor/products/${p.id}/edit`}
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteProduct(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
