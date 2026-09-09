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

          <form onSubmit={s}>
            {Object.keys(f).map((k) => (
              <div className="mb-3" key={k}>
                <label className="form-label">{k}</label>

                {k === "storeAddress" ? (
                  <textarea
                    className="form-control"
                    value={f[k]}
                    onChange={(e) =>
                      setF({
                        ...f,
                        [k]: e.target.value,
                      })
                    }
                    required
                  />
                ) : (
                  <input
                    className="form-control"
                    type={
                      k === "password"
                        ? "password"
                        : k === "email"
                          ? "email"
                          : "text"
                    }
                    value={f[k]}
                    onChange={(e) =>
                      setF({
                        ...f,
                        [k]: e.target.value,
                      })
                    }
                    required
                  />
                )}
              </div>
            ))}

            <button className="btn btn-primary">Submit Application</button>
          </form>
        </div>
      </div>
    </div>
  );
}
