import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { addIssue } from "../store/slices/issueSlice";

export default function Issues() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const issues = useSelector((state) => state.issues.items);

  const orders = useSelector((state) => state.orders.items);

  const [s, setS] = useState("");
  const [d, setD] = useState("");
  const [o, setO] = useState("");
  const [p, setP] = useState("MEDIUM");

  const submit = async (e) => {
    e.preventDefault();

    if (!s || !d) return;

    try {
      await dispatch(
        addIssue({
          subject: s,
          description: d,
          orderId: o || undefined,
          priority: p,
        }),
      ).unwrap();

      setS("");
      setD("");
      setO("");
    } catch (error) {
      alert(error || "Failed to submit issue.");
    }
  };

  const userId = user?._id || user?.id;

  const myOrders = orders.filter((x) => String(x.userId) === String(userId));

  const myIssues = issues.filter((i) => String(i.userId) === String(userId));

  return (
    <div className="container py-4">
      <h2>Customer Issues</h2>

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
                />

                <textarea
                  className="form-control mb-2"
                  placeholder="Description"
                  value={d}
                  onChange={(e) => setD(e.target.value)}
                />

                <select
                  className="form-select mb-2"
                  value={o}
                  onChange={(e) => setO(e.target.value)}
                >
                  <option value="">No specific order</option>

                  {myOrders.map((x) => (
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

                <button className="btn btn-primary">Submit Issue</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {myIssues.map((i) => (
            <div className="card mb-2" key={i.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <h5>
                    #{i.id} — {i.subject}
                  </h5>

                  <span className="badge text-bg-secondary">{i.status}</span>
                </div>

                <p>{i.description}</p>

                {i.response && (
                  <div className="alert alert-light">{i.response}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
