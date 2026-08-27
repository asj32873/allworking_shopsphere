import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";

export default function VendorProfile() {
  const { user, vendors } = useApp();

  const v = vendors.find(
    (x) => String(x.userId) === String(user.id)
  );

  return (
    <PortalLayout type="vendor">
      <div className="py-4">
        <h2>Vendor Profile</h2>

        <div className="card">
          <div className="card-body">
            <p>
              <strong>Store:</strong> {v?.storeName}
            </p>
            <p>
              <strong>Account:</strong> {user.email}
            </p>
            <p>
              <strong>Address:</strong> {v?.storeAddress}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="badge text-bg-success">
                {v?.status}
              </span>
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
