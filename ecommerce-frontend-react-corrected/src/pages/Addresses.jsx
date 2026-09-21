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

  const startEdit = (a) => {
    setEdit(a.id);

    setF({
      type: a.type,
      addressLine: a.addressLine,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    });
  };

  const cancelEdit = () => {
    setEdit(null);
    setF(empty);
  };

  return (
    <div className="addresses-page">
      <div className="container">
        <header className="addresses-header">
          <div>
            <div className="addresses-eyebrow">
              DELIVERY SETTINGS
            </div>

            <h1 className="addresses-title">
              My Addresses
            </h1>

            <p className="addresses-subtitle">
              Manage the addresses you use for ShopSphere
              deliveries.
            </p>
          </div>

          <div className="addresses-count">
            {addresses.length}{" "}
            {addresses.length === 1 ? "address" : "addresses"}
          </div>
        </header>

        <div className="addresses-layout">
          {/* ADDRESS FORM */}
          <section className="address-form-card">
            <div className="address-form-header">
              <div className="address-form-icon">
                <i
                  className={
                    edit
                      ? "bi bi-pencil-square"
                      : "bi bi-plus-lg"
                  }
                />
              </div>

              <div>
                <div className="address-form-eyebrow">
                  {edit ? "UPDATE ADDRESS" : "NEW ADDRESS"}
                </div>

                <h2>
                  {edit ? "Edit Address" : "Add Address"}
                </h2>
              </div>
            </div>

            <p className="address-form-description">
              {edit
                ? "Update the details of your saved delivery address."
                : "Add a delivery address for faster checkout."}
            </p>

            <form
              onSubmit={submit}
              className="address-form"
            >
              <div className="address-field">
                <label htmlFor="address-type">
                  Address Type
                </label>

                <select
                  id="address-type"
                  className="address-input"
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
              </div>

              <div className="address-field">
                <label htmlFor="address-line">
                  Address
                </label>

                <input
                  id="address-line"
                  className="address-input"
                  placeholder="123 Demo Street"
                  required
                  value={f.addressLine}
                  onChange={(e) =>
                    setF({
                      ...f,
                      addressLine: e.target.value,
                    })
                  }
                />
              </div>

              <div className="address-form-row">
                <div className="address-field">
                  <label htmlFor="address-city">
                    City
                  </label>

                  <input
                    id="address-city"
                    className="address-input"
                    placeholder="Bengaluru"
                    required
                    value={f.city}
                    onChange={(e) =>
                      setF({
                        ...f,
                        city: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="address-field">
                  <label htmlFor="address-state">
                    State
                  </label>

                  <input
                    id="address-state"
                    className="address-input"
                    placeholder="Karnataka"
                    required
                    value={f.state}
                    onChange={(e) =>
                      setF({
                        ...f,
                        state: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="address-field">
                <label htmlFor="address-pincode">
                  Pincode
                </label>

                <input
                  id="address-pincode"
                  className="address-input"
                  placeholder="560001"
                  required
                  value={f.pincode}
                  onChange={(e) =>
                    setF({
                      ...f,
                      pincode: e.target.value,
                    })
                  }
                />
              </div>

              <div className="address-form-actions">
                <button
                  type="submit"
                  className="address-save-button"
                >
                  <i
                    className={
                      edit
                        ? "bi bi-check-lg"
                        : "bi bi-plus-lg"
                    }
                  />

                  {edit ? "Update Address" : "Add Address"}
                </button>

                {edit && (
                  <button
                    type="button"
                    className="address-cancel-button"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* SAVED ADDRESSES */}
          <section className="saved-addresses">
            <div className="saved-addresses-header">
              <div>
                <div className="saved-addresses-eyebrow">
                  SAVED LOCATIONS
                </div>

                <h2>Saved Addresses</h2>
              </div>

              <span>{addresses.length}</span>
            </div>

            {loading && (
              <div className="addresses-loading">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                />

                <span>Loading addresses...</span>
              </div>
            )}

            {!loading && addresses.length === 0 && (
              <div className="addresses-empty">
                <div className="addresses-empty-icon">
                  <i className="bi bi-geo-alt" />
                </div>

                <h3>No saved addresses</h3>

                <p>
                  Add your first delivery address using the
                  form.
                </p>
              </div>
            )}

            {!loading && addresses.length > 0 && (
              <div className="saved-address-list">
                {addresses.map((a) => (
                  <article
                    className="saved-address-card"
                    key={a.id || a._id}
                  >
                    <div className="saved-address-top">
                      <div className="saved-address-identity">
                        <div className="saved-address-icon">
                          <i
                            className={
                              a.type === "Office"
                                ? "bi bi-building"
                                : a.type === "Other"
                                  ? "bi bi-geo"
                                  : "bi bi-house"
                            }
                          />
                        </div>

                        <div>
                          <div className="saved-address-label">
                            {a.type}
                          </div>

                          {a.isDefault && (
                            <span className="saved-address-default">
                              <i className="bi bi-check-circle-fill" />
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="saved-address-details">
                      <p>{a.addressLine}</p>

                      <p>
                        {a.city}, {a.state} - {a.pincode}
                      </p>
                    </div>

                    <div className="saved-address-actions">
                      <button
                        type="button"
                        className="address-action-edit"
                        onClick={() => startEdit(a)}
                      >
                        <i className="bi bi-pencil" />
                        Edit
                      </button>

                      {!a.isDefault && (
                        <button
                          type="button"
                          className="address-action-default"
                          onClick={() =>
                            dispatch(
                              setDefaultAddress(a.id),
                            )
                          }
                        >
                          <i className="bi bi-check2" />
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        className="address-action-delete"
                        onClick={() =>
                          dispatch(deleteAddress(a.id))
                        }
                      >
                        <i className="bi bi-trash3" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}