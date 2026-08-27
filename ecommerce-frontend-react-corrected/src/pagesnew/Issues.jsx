import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Issues() {
  const { user, issues, orders, addIssue } = useApp();

  const [s, setS] = useState("");
  const [d, setD] = useState("");
  const [o, setO] = useState("");
  const [p, setP] = useState("MEDIUM");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const mine = issues.filter(
    (i) => String(i.userId) === String(user.id)
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await addIssue({
        subject: s,
        description: d,
        orderId: o || null,
        priority: p,
      });

      setS("");
      setD("");
      setO("");
      setP("MEDIUM");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-4">
      <h2>Customer Issues</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <form onSubmit={submit}>
                <input
                  className="form-control mb-2"
                  placeholder="Subject"
                  value={s}
                  onChange={(e) => setS(e.target.value)}
                  required
                />

                <textarea
                  className="form-control mb-2"
                  placeholder="Description"
                  value={d}
                  onChange={(e) => setD(e.target.value)}
                  required
                />

                <select
                  className="form-select mb-2"
                  value={o}
                  onChange={(e) => setO(e.target.value)}
                >
                  <option value="">No specific order</option>
                  {orders
                    .filter(
                      (x) => String(x.userId) === String(user.id)
                    )
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        #{x.id}
                      </option>
                    ))}
                </select>

                <select
                  className="form-select mb-2"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                >
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>URGENT</option>
                </select>

                <button
                  className="btn btn-primary"
                  disabled={busy}
                >
                  {busy ? "Submitting..." : "Submit Issue"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {mine.map((i) => (
            <div className="card mb-2" key={i.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <h5>
                    #{String(i.id).slice(-6)} — {i.subject}
                  </h5>
                  <span className="badge text-bg-secondary">
                    {i.status}
                  </span>
                </div>

                <p>{i.description}</p>

                {i.response && (
                  <div className="alert alert-light">
                    {i.response}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
