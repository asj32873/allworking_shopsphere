import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

import { login } from "../store/slices/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      const result = await dispatch(login({ email, password })).unwrap();

      nav(
        result.user.role === "USER"
          ? "/user/home"
          : result.user.role === "VENDOR"
            ? "/vendor/dashboard"
            : "/admin/dashboard",
      );
    } catch (error) {
      setError(error || "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  };

  const loginWithAuth0 = async () => {
    try {
      setError("");

      await loginWithRedirect({
        appState: {
          returnTo: "/user/home",
        },
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "openid profile email",
        },
      });
    } catch (error) {
      console.error("Auth0 login failed:", error);

      setError(error?.message || "Unable to start Auth0 login.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-brand-mark">
            <i className="bi bi-bag-heart-fill" />
          </div>

          <div className="auth-brand-eyebrow">WELCOME BACK</div>

          <h1 className="auth-brand-title">
            Your marketplace,
            <br />
            all in one place.
          </h1>

          <p className="auth-brand-description">
            Sign in to manage your shopping, orders, reviews, and account.
          </p>

          <div className="auth-brand-points">
            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-shield-check" />
              </span>
              <span>Secure account access</span>
            </div>

            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-box-seam" />
              </span>
              <span>Track your orders</span>
            </div>

            <div className="auth-brand-point">
              <span className="auth-brand-point-icon">
                <i className="bi bi-shop" />
              </span>
              <span>Built for shoppers and vendors</span>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <div className="auth-form-eyebrow">ACCOUNT ACCESS</div>

            <h2 className="auth-form-title">Sign in</h2>

            <p className="auth-form-subtitle">
              Enter your credentials to continue to ShopSphere.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <i className="bi bi-exclamation-circle-fill" />

              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>

              <div className="auth-input-wrap">
                <i className="bi bi-envelope" />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>
              </div>

              <div className="auth-input-wrap">
                <i className="bi bi-lock" />

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-primary-button"
              disabled={busy || auth0Loading}
            >
              {busy ? (
                <>
                  <span className="auth-button-spinner" />
                  Logging in...
                </>
              ) : (
                <>
                  Sign in
                  <i className="bi bi-arrow-right" />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="auth-google-button"
            onClick={loginWithAuth0}
            disabled={auth0Loading || busy}
          >
            <span className="auth-google-icon">G</span>

            <span>
              {auth0Loading ? "Connecting..." : "Continue with Google"}
            </span>
          </button>

          <div className="auth-demo-box">
            <div className="auth-demo-header">
              <i className="bi bi-info-circle" />
              <span>Demo accounts</span>
            </div>

            <div className="auth-demo-account">
              <span>User</span>
              <code>user@example.com / user123</code>
            </div>

            <div className="auth-demo-account">
              <span>Vendor</span>
              <code>vendor@example.com / vendor123</code>
            </div>

            <div className="auth-demo-account">
              <span>Admin</span>
              <code>admin@example.com / admin123</code>
            </div>
          </div>

          <div className="auth-footer-links">
            <span>Don't have an account?</span>
            <Link to="/register">Create account</Link>

            <span className="auth-footer-separator">·</span>

            <Link to="/vendor/register">Become a vendor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}