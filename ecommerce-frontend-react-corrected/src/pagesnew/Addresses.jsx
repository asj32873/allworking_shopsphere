import { useState } from "react";
import { useApp } from "../context/AppContext";

const empty = {
  type: "Home",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Addresses() {
  const {
    user,
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useApp();

  const mine = addresses.filter(
    (a) => String(a.userId) === String(user.id)
  );

  const [f, setF] = useState(empty);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (edit) await updateAddress(edit, f);
      else await addAddress(f);

      setF(empty);
      setEdit(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5>{edit ? "Edit" : "Add"} Address</h5>

              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              <form onSubmit={submit}>
                <select
                  className="form-select mb-2"
                  value={f.type}
                  onChange={(e) =>
                    setF({ ...f, type: e.target.value })
                  }
                >
                  <option>Home</option>
                  <option>Office</option>
                  <option>Other</option>
                </select>

                {["addressLine", "city", "state", "pincode"].map((k) => (
                  <input
                    key={k}
                    className="form-control mb-2"
                    placeholder={k}
                    required
                    value={f[k]}
                    onChange={(e) =>
                      setF({ ...f, [k]: e.target.value })
                    }
                  />
                ))}

                <button className="btn btn-primary">
                  {edit ? "Update" : "Add"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <h2>My Addresses</h2>

          {mine.map((a) => (
            <div className="card mb-2" key={a.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <strong>{a.type}</strong>
                  {a.isDefault && (
                    <span className="badge text-bg-primary">
                      Default
                    </span>
                  )}
                </div>

                <p>
                  {a.addressLine}, {a.city}, {a.state} - {a.pincode}
                </p>

                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => {
                    setEdit(a.id);
                    setF({
                      type: a.type,
                      addressLine: a.addressLine,
                      city: a.city,
                      state: a.state,
                      pincode: a.pincode,
                    });
                  }}
                >
                  Edit
                </button>

                {!a.isDefault && (
                  <button
                    className="btn btn-sm btn-outline-success me-2"
                    onClick={() => setDefaultAddress(a.id)}
                  >
                    Make Default
                  </button>
                )}

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => deleteAddress(a.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
