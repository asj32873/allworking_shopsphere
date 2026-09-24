import { useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

export default function VendorProfile() {
  const user = useSelector((state) => state.auth.user);

  const vendors = useSelector((state) => state.vendors.items);

  const v = vendors.find(
    (x) => String(x.userId) === String(user?.id),
  );

  return (
    <PortalLayout type="vendor">
      <div className="vendor-profile-page">
        <header className="vendor-profile-header">
          <div>
            <div className="vendor-profile-eyebrow">
              VENDOR ACCOUNT
            </div>

            <h1 className="vendor-profile-title">
              Vendor Profile
            </h1>

            <p className="vendor-profile-subtitle">
              View your store information and vendor account status.
            </p>
          </div>

          <div className="vendor-profile-status">
            <span className="vendor-profile-status-dot" />
            {v?.status || "UNKNOWN"}
          </div>
        </header>

        <div className="vendor-profile-layout">
          <section className="vendor-profile-store-card">
            <div className="vendor-profile-store-icon">
              <i className="bi bi-shop" />
            </div>

            <div className="vendor-profile-store-eyebrow">
              STORE
            </div>

            <h2 className="vendor-profile-store-name">
              {v?.storeName || "—"}
            </h2>

            <p className="vendor-profile-store-description">
              Your ShopSphere vendor storefront
            </p>

            <div className="vendor-profile-store-divider" />

            <div className="vendor-profile-store-status">
              <span className="vendor-profile-store-status-label">
                Account Status
              </span>

              <span className="vendor-profile-store-status-value">
                <span className="vendor-profile-status-dot" />
                {v?.status || "UNKNOWN"}
              </span>
            </div>
          </section>

          <section className="vendor-profile-details-card">
            <div className="vendor-profile-card-header">
              <div className="vendor-profile-card-icon">
                <i className="bi bi-person-badge" />
              </div>

              <div>
                <div className="vendor-profile-card-eyebrow">
                  ACCOUNT INFORMATION
                </div>

                <h2 className="vendor-profile-card-title">
                  Store Details
                </h2>
              </div>
            </div>

            <div className="vendor-profile-details">
              <div className="vendor-profile-detail">
                <div className="vendor-profile-detail-icon">
                  <i className="bi bi-shop" />
                </div>

                <div>
                  <div className="vendor-profile-detail-label">
                    Store Name
                  </div>

                  <div className="vendor-profile-detail-value">
                    {v?.storeName || "—"}
                  </div>
                </div>
              </div>

              <div className="vendor-profile-detail">
                <div className="vendor-profile-detail-icon">
                  <i className="bi bi-envelope" />
                </div>

                <div>
                  <div className="vendor-profile-detail-label">
                    Account Email
                  </div>

                  <div className="vendor-profile-detail-value">
                    {user?.email || "—"}
                  </div>
                </div>
              </div>

              <div className="vendor-profile-detail">
                <div className="vendor-profile-detail-icon">
                  <i className="bi bi-geo-alt" />
                </div>

                <div>
                  <div className="vendor-profile-detail-label">
                    Store Address
                  </div>

                  <div className="vendor-profile-detail-value">
                    {v?.storeAddress || "—"}
                  </div>
                </div>
              </div>

              <div className="vendor-profile-detail">
                <div className="vendor-profile-detail-icon">
                  <i className="bi bi-shield-check" />
                </div>

                <div>
                  <div className="vendor-profile-detail-label">
                    Vendor Status
                  </div>

                  <div className="vendor-profile-detail-value">
                    {v?.status || "—"}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PortalLayout>
  );
}