import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="container py-5">
      <div className="col-md-7 mx-auto card">
        <div className="card-body">
          <h2>Create Account</h2>

          {err && <div className="alert alert-danger">{err}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Name</label>

              <input
                className="form-control"
                value={f.name}
                onChange={(e) =>
                  setF({
                    ...f,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>

              <input
                type="email"
                className="form-control"
                value={f.email}
                onChange={(e) =>
                  setF({
                    ...f,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Phone</label>

              <input
                className="form-control"
                value={f.phone}
                onChange={(e) =>
                  setF({
                    ...f,
                    phone: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>

              <input
                type="password"
                className="form-control"
                value={f.password}
                onChange={(e) =>
                  setF({
                    ...f,
                    password: e.target.value,
                  })
                }
                required
              />
            </div>

            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
