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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="mb-4">Login</h2>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={submit}>
                <label>Email</label>

                <input
                  className="form-control mb-3"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label>Password</label>

                <input
                  type="password"
                  className="form-control mb-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={busy || auth0Loading}
                >
                  {busy ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="d-flex align-items-center my-4">
                <hr className="flex-grow-1" />

                <span className="px-3 text-muted">OR</span>

                <hr className="flex-grow-1" />
              </div>

              <button
                type="button"
                className="btn btn-outline-dark w-100"
                onClick={loginWithAuth0}
                disabled={auth0Loading || busy}
              >
                {auth0Loading ? "Loading..." : "Continue with Google"}
              </button>

              <hr />

              <small>
                Seed accounts:
                <br />
                user@example.com / user123
                <br />
                vendor@example.com / vendor123
                <br />
                admin@example.com / admin123
              </small>

              <div className="mt-3">
                <Link to="/register">Create account</Link>

                {" · "}

                <Link to="/vendor/register">Become a vendor</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
