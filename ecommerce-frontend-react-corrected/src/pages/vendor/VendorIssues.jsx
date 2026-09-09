import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { updateIssue } from "../../store/slices/issueSlice";

export default function VendorIssues() {
  const dispatch = useDispatch();

  const issues = useSelector((state) => state.issues.items);

  const orders = useSelector((state) => state.orders.items);

  const user = useSelector((state) => state.auth.user);

  const mine = issues.filter(
    (i) =>
      String(i.vendorId) === String(user?.id) ||
      orders
        .find((o) => String(o.id) === String(i.orderId))
        ?.items?.some((x) => String(x.vendorId) === String(user?.id)),
  );

  return (
    <PortalLayout type="vendor">
      <div className="py-4">
        <h2>Customer Issues</h2>

        {mine.map((i) => (
          <div className="card mb-3" key={i.id}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h5>
                  #{i.id} — {i.subject}
                </h5>

                <span className="badge text-bg-secondary">{i.status}</span>
              </div>

              <p>{i.description}</p>

              <button
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() =>
                  dispatch(
                    updateIssue({
                      id: i.id,
                      data: {
                        status: "IN_PROGRESS",
                      },
                    }),
                  )
                }
              >
                In Progress
              </button>

              <button
                className="btn btn-success btn-sm"
                onClick={() =>
                  dispatch(
                    updateIssue({
                      id: i.id,
                      data: {
                        status: "RESOLVED",
                        response: "Resolved by vendor.",
                      },
                    }),
                  )
                }
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
