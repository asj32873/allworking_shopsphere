import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Register() {
  const { registerUser } = useApp();
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
      const result = await registerUser(f);
      if (!result.ok) return setErr(result.message);
      nav("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="col-md-6 mx-auto card">
        <div className="card-body">
          <h2>Create Account</h2>
          {err && <div className="alert alert-danger">{err}</div>}

          <form onSubmit={submit}>
            {Object.keys(f).map((k) => (
              <div className="mb-3" key={k}>
                <label className="form-label">{k}</label>
                <input
                  className="form-control"
                  type={k === "password" ? "password" : k === "email" ? "email" : "text"}
                  required={k !== "phone"}
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                />
              </div>
            ))}

            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
