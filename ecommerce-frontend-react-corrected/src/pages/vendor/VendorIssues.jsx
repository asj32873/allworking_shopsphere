import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
export default function VendorIssues() {
  const { issues, user, orders, updateIssue } = useApp();
  const mine = issues.filter(
    (i) =>
      i.vendorId === user.id ||
      orders
        .find((o) => o.id === i.orderId)
        ?.items.some((x) => x.vendorId === user.id),
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
                onClick={() => updateIssue(i.id, { status: "IN_PROGRESS" })}
              >
                In Progress
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() =>
                  updateIssue(i.id, {
                    status: "RESOLVED",
                    response: "Resolved by vendor.",
                  })
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
