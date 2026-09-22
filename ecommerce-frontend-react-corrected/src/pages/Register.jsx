import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { registerUser } from "../store/slices/authSlice";

export default function Register() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setErr("");
    setBusy(true);

    try {
      await dispatch(registerUser(f)).unwrap();

      nav("/login");
    } catch (error) {
      setErr(error || "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-register">
        <div className="auth-brand-panel">
          <div className="auth-brand-mark">
            <i className="bi bi-person-plus-fill" />
          </div>

          <div className="auth-brand-eyebrow">JOIN SHOPSPHERE</div>

          <h1 className="auth-brand-title">
            Everything you need,
            <br />
            in one account.
          </h1>

          <p className="auth-brand-description">
            Create your ShopSphere account and start shopping, managing
            orders, and connecting with vendors.
          </p>

          <div className="auth-brand-points">
            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-person-check" />
              </span>
              <span>Personalized account experience</span>
            </div>

            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-bag-check" />
              </span>
              <span>Simple and secure shopping</span>
            </div>

            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-truck" />
              </span>
              <span>Keep track of your orders</span>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <div className="auth-form-eyebrow">CREATE ACCOUNT</div>

            <h2 className="auth-form-title">Get started</h2>

            <p className="auth-form-subtitle">
              Fill in your details to create your ShopSphere account.
            </p>
          </div>

          {err && (
            <div className="auth-error">
              <i className="bi bi-exclamation-circle-fill" />
              <span>{err}</span>
            </div>
          )}

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>

              <div className="auth-input-wrap">
                <i className="bi bi-person" />

                <input
                  id="register-name"
                  type="text"
                  value={f.name}
                  onChange={(e) =>
                    setF({
                      ...f,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email address</label>

              <div className="auth-input-wrap">
                <i className="bi bi-envelope" />

                <input
                  id="register-email"
                  type="email"
                  value={f.email}
                  onChange={(e) =>
                    setF({
                      ...f,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-phone">Phone number</label>

              <div className="auth-input-wrap">
                <i className="bi bi-telephone" />

                <input
                  id="register-phone"
                  type="tel"
                  value={f.phone}
                  onChange={(e) =>
                    setF({
                      ...f,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>

              <div className="auth-input-wrap">
                <i className="bi bi-lock" />

                <input
                  id="register-password"
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

            <button
              type="submit"
              className="auth-primary-button"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="auth-button-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <i className="bi bi-arrow-right" />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-links">
            <span>Already have an account?</span>

            <Link to="/login">Sign in</Link>

            <span className="auth-footer-separator">·</span>

            <Link to="/vendor/register">Become a vendor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}