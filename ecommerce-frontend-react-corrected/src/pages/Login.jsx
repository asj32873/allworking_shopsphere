import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useApp } from "../context/AppContext";

export default function Login() {
  const { login, loginWithAuth0 } = useApp();

  const nav = useNavigate();

  const location = useLocation();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  const returnTo = location.state?.returnTo || "/user/home";

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      const result = await login(email, password);

      if (!result.ok) {
        setError(result.message);

        return;
      }

      nav(
        result.user.role === "USER"
          ? "/user/home"
          : result.user.role === "VENDOR"
            ? "/vendor/dashboard"
            : "/admin/dashboard",
        {
          replace: true,
        },
      );
    } finally {
      setBusy(false);
    }
  };

  const continueWithAuth0 = async () => {
    setError("");

    try {
      await loginWithAuth0(returnTo);
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to start Auth0 login.");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="mb-3">Login</h2>

              {error && <div className="alert alert-danger">{error}</div>}

              <button
                type="button"
                className="btn btn-dark w-100 mb-3"
                onClick={continueWithAuth0}
              >
                <i className="bi bi-google me-2" />
                Continue with Google / Auth0
              </button>

              <div className="text-center text-muted small mb-3">OR</div>

              <form onSubmit={submit}>
                <label className="form-label">Email</label>

                <input
                  type="email"
                  className="form-control mb-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <label className="form-label">Password</label>

                <input
                  type="password"
                  className="form-control mb-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button className="btn btn-primary w-100" disabled={busy}>
                  {busy ? "Signing in..." : "Login with Email & Password"}
                </button>
              </form>

              <div className="mt-3 text-center">
                <Link to="/register">Create account</Link>

                {" · "}

                <Link to="/vendor/register">Become a vendor</Link>
              </div>

              <p className="small text-muted mt-3 mb-0">
                The Auth0 button opens Auth0 Universal Login. Google and any
                other identity providers enabled in your Auth0 tenant will be
                available there.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
