import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { registerVendor } from "../store/slices/authSlice";

export default function VendorRegister() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const [f, setF] = useState({
    ownerName: "",
    storeName: "",
    email: "",
    phone: "",
    storeAddress: "",
    password: "",
  });

  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const s = async (e) => {
    e.preventDefault();

    setErr("");

    try {
      await dispatch(registerVendor(f)).unwrap();
      setOk(true);
    } catch (error) {
      setErr(error || "Registration failed.");
    }
  };

  if (ok) {
    return (
      <div className="auth-page">
        <div className="vendor-success-card">
          <div className="vendor-success-icon">
            <i className="bi bi-check-lg" />
          </div>

          <div className="auth-form-eyebrow">APPLICATION RECEIVED</div>

          <h1 className="vendor-success-title">
            Application submitted
          </h1>

          <p className="vendor-success-message">
            Your vendor application has been submitted successfully.
            An administrator needs to review and approve your application
            before you can access the vendor dashboard.
          </p>

          <div className="vendor-success-status">
            <span className="vendor-success-status-dot" />

            <div>
              <span className="vendor-success-status-label">
                APPLICATION STATUS
              </span>

              <strong>APPLIED</strong>
            </div>
          </div>

          <button
            type="button"
            className="auth-primary-button"
            onClick={() => nav("/login")}
          >
            Go to Login
            <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-vendor">
        <div className="auth-brand-panel">
          <div className="auth-brand-mark">
            <i className="bi bi-shop-window" />
          </div>

          <div className="auth-brand-eyebrow">SELL ON SHOPSPHERE</div>

          <h1 className="auth-brand-title">
            Build your store,
            <br />
            grow your business.
          </h1>

          <p className="auth-brand-description">
            Apply to become a ShopSphere vendor and bring your products
            to customers through the marketplace.
          </p>

          <div className="auth-brand-points">
            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-shop" />
              </span>

              <span>Create your store presence</span>
            </div>

            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-box-seam" />
              </span>

              <span>Manage your products and inventory</span>
            </div>

            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-graph-up-arrow" />
              </span>

              <span>Manage orders and grow your sales</span>
            </div>
          </div>

          <div className="vendor-approval-note">
            <i className="bi bi-shield-check" />

            <span>
              Every vendor application is reviewed by an administrator
              before approval.
            </span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <div className="auth-form-eyebrow">
              VENDOR APPLICATION
            </div>

            <h2 className="auth-form-title">Become a vendor</h2>

            <p className="auth-form-subtitle">
              Provide your store and contact details to submit your
              application.
            </p>
          </div>

          {err && (
            <div className="auth-error">
              <i className="bi bi-exclamation-circle-fill" />

              <span>{err}</span>
            </div>
          )}

          <form onSubmit={s} className="auth-form">
            <div className="vendor-form-section">
              <div className="vendor-form-section-title">
                <i className="bi bi-person" />
                <span>Owner details</span>
              </div>

              <div className="auth-field">
                <label htmlFor="vendor-ownerName">
                  Owner name
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-person" />

                  <input
                    id="vendor-ownerName"
                    type="text"
                    value={f.ownerName}
                    onChange={(e) =>
                      setF({
                        ...f,
                        ownerName: e.target.value,
                      })
                    }
                    placeholder="Enter owner name"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="vendor-email">
                  Email address
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-envelope" />

                  <input
                    id="vendor-email"
                    type="email"
                    value={f.email}
                    onChange={(e) =>
                      setF({
                        ...f,
                        email: e.target.value,
                      })
                    }
                    placeholder="store@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="vendor-phone">
                  Phone number
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-telephone" />

                  <input
                    id="vendor-phone"
                    type="tel"
                    value={f.phone}
                    onChange={(e) =>
                      setF({
                        ...f,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="vendor-form-section">
              <div className="vendor-form-section-title">
                <i className="bi bi-shop" />
                <span>Store details</span>
              </div>

              <div className="auth-field">
                <label htmlFor="vendor-storeName">
                  Store name
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-shop" />

                  <input
                    id="vendor-storeName"
                    type="text"
                    value={f.storeName}
                    onChange={(e) =>
                      setF({
                        ...f,
                        storeName: e.target.value,
                      })
                    }
                    placeholder="Enter your store name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="vendor-storeAddress">
                  Store address
                </label>

                <div className="auth-input-wrap auth-textarea-wrap">
                  <i className="bi bi-geo-alt" />

                  <textarea
                    id="vendor-storeAddress"
                    value={f.storeAddress}
                    onChange={(e) =>
                      setF({
                        ...f,
                        storeAddress: e.target.value,
                      })
                    }
                    placeholder="Enter your store address"
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="vendor-form-section">
              <div className="vendor-form-section-title">
                <i className="bi bi-lock" />
                <span>Account security</span>
              </div>

              <div className="auth-field">
                <label htmlFor="vendor-password">
                  Password
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-lock" />

                  <input
                    id="vendor-password"
                    type="password"
                    value={f.password}
                    onChange={(e) =>
                      setF({
                        ...f,
                        password: e.target.value,
                      })
                    }
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="auth-primary-button"
            >
              Submit Application
              <i className="bi bi-arrow-right" />
            </button>
          </form>

          <div className="auth-footer-links">
            <span>Already have an account?</span>

            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                nav("/login");
              }}
            >
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}