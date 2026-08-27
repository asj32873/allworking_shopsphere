import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
export default function VendorRegister() {
  const { registerVendor } = useApp(),
    nav = useNavigate();
  const [f, setF] = useState({
      ownerName: "",
      storeName: "",
      email: "",
      phone: "",
      storeAddress: "",
      password: "",
    }),
    [err, setErr] = useState(""),
    [ok, setOk] = useState(false);
  const s = (e) => {
    e.preventDefault();
    const r = registerVendor(f);
    if (!r.ok) return setErr(r.message);
    setOk(true);
  };
  if (ok)
    return (
      <div className="container py-5">
        <div className="alert alert-success">
          <h4>Application submitted</h4>
          <p>Status: APPLIED. Admin approval is required.</p>
          <button className="btn btn-primary" onClick={() => nav("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  return (
    <div className="container py-5">
      <div className="col-md-7 mx-auto card">
        <div className="card-body">
          <h2>Vendor Registration</h2>
          {err && <div className="alert alert-danger">{err}</div>}
          <form onSubmit={s}>
            {Object.keys(f).map((k) => (
              <div className="mb-3" key={k}>
                <label className="form-label">{k}</label>
                {k === "storeAddress" ? (
                  <textarea
                    className="form-control"
                    name={k}
                    required
                    value={f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  />
                ) : (
                  <input
                    className="form-control"
                    name={k}
                    type={k === "password" ? "password" : "text"}
                    required
                    value={f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <button className="btn btn-primary w-100">
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
