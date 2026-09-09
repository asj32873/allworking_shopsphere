import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  addAddress,
  deleteAddress,
  loadAddresses,
  setDefaultAddress,
  updateAddress,
} from "../store/slices/addressSlice";

const empty = {
  type: "Home",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Addresses() {
  const dispatch = useDispatch();

  const addresses = useSelector((state) => state.addresses.items);

  const loading = useSelector((state) => state.addresses.loading);

  const [f, setF] = useState(empty);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    dispatch(loadAddresses());
  }, [dispatch]);

  const submit = async (e) => {
    e.preventDefault();

    if (edit) {
      await dispatch(
        updateAddress({
          id: edit,
          data: f,
        }),
      );
    } else {
      await dispatch(addAddress(f));
    }

    setF(empty);
    setEdit(null);
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5>{edit ? "Edit" : "Add"} Address</h5>

              <form onSubmit={submit}>
                <select
                  className="form-select mb-2"
                  value={f.type}
                  onChange={(e) =>
                    setF({
                      ...f,
                      type: e.target.value,
                    })
                  }
                >
                  <option>Home</option>
                  <option>Office</option>
                  <option>Other</option>
                </select>

                {Object.keys(f)
                  .filter((k) => k !== "type")
                  .map((k) => (
                    <input
                      key={k}
                      className="form-control mb-2"
                      placeholder={k}
                      required
                      value={f[k]}
                      onChange={(e) =>
                        setF({
                          ...f,
                          [k]: e.target.value,
                        })
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

          {loading && <p>Loading...</p>}

          {addresses.map((a) => (
            <div className="card mb-2" key={a.id}>
              <div className="card-body">
                <h5>
                  {a.type}
                  {a.isDefault && (
                    <span className="badge text-bg-success ms-2">Default</span>
                  )}
                </h5>

                <p className="mb-2">
                  {a.addressLine}
                  <br />
                  {a.city}, {a.state} - {a.pincode}
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
                    onClick={() => dispatch(setDefaultAddress(a.id))}
                  >
                    Make Default
                  </button>
                )}

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => dispatch(deleteAddress(a.id))}
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
