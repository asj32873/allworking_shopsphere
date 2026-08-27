import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
export default function AdminIssues() {
  const { issues, updateIssue, vendors } = useApp();
  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Issue Management</h2>
        {issues.map((i) => (
          <div className="card mb-3" key={i.id}>
            <div className="card-body row align-items-center">
              <div className="col-lg-6">
                <h5>
                  #{i.id} — {i.subject}
                </h5>
                <p>{i.description}</p>
                <small>
                  Priority: {i.priority} · Order: {i.orderId || "N/A"}
                </small>
              </div>
              <div className="col-lg-3">
                <select
                  className="form-select"
                  value={i.vendorId || ""}
                  onChange={(e) =>
                    updateIssue(i.id, {
                      vendorId: e.target.value ? +e.target.value : null,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {vendors
                    .filter((v) => v.status === "VERIFIED")
                    .map((v) => (
                      <option key={v.id} value={v.userId}>
                        {v.storeName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-lg-3">
                <select
                  className="form-select"
                  value={i.status}
                  onChange={(e) =>
                    updateIssue(i.id, { status: e.target.value })
                  }
                >
                  <option>OPEN</option>
                  <option>IN_PROGRESS</option>
                  <option>RESOLVED</option>
                  <option>CLOSED</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
