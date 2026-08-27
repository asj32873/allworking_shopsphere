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

  const s = async (e) => {
    e.preventDefault();
    setErr("");
    const r = await registerUser(f);

    if (!r.ok) {
      return setErr(r.message);
    }

    nav("/login");
  };

  return (
    <div className="container py-5">
      <div className="col-md-6 mx-auto card">
        <div className="card-body">
          <h2>Create Account</h2>

          {err && <div className="alert alert-danger">{err}</div>}

          <form onSubmit={s}>
            {Object.keys(f).map((k) => (
              <div className="mb-3" key={k}>
                <label className="form-label">{k}</label>

                <input
                  className="form-control"
                  name={k}
                  type={
                    k === "password"
                      ? "password"
                      : k === "email"
                        ? "email"
                        : k === "phone"
                          ? "tel"
                          : "text"
                  }
                  required
                  value={f[k]}
                  onChange={(e) =>
                    setF({
                      ...f,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
            ))}

            <button className="btn btn-primary w-100">Create Account</button>
          </form>
        </div>
      </div>
    </div>
  );
}
