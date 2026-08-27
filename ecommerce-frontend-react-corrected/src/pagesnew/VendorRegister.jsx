import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function VendorRegister() {
  const { registerVendor } = useApp();
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
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      const result = await registerVendor(f);
      if (!result.ok) return setErr(result.message);
      setOk(true);
    } finally {
      setBusy(false);
    }
  };

  if (ok) {
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
  }

  return (
    <div className="container py-5">
      <div className="col-md-7 mx-auto card">
        <div className="card-body">
          <h2>Vendor Registration</h2>
          {err && <div className="alert alert-danger">{err}</div>}

          <form onSubmit={submit}>
            {Object.keys(f).map((k) => (
              <div className="mb-3" key={k}>
                <label className="form-label">{k}</label>
                {k === "storeAddress" ? (
                  <textarea
                    className="form-control"
                    required
                    value={f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  />
                ) : (
                  <input
                    className="form-control"
                    type={k === "password" ? "password" : k === "email" ? "email" : "text"}
                    required={k !== "phone"}
                    value={f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
