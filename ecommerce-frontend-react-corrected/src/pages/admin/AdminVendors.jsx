import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import {
  approveVendor,
  rejectVendor,
  deleteVendor,
} from "../../store/slices/vendorSlice";

export default function AdminVendors() {
  const dispatch = useDispatch();

  const vendors = useSelector((state) => state.vendors.items);

  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Vendor Management</h2>

        <div className="card">
          <div className="card-body table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td>{v.storeName}</td>
                    <td>{v.email}</td>
                    <td>{v.status}</td>

                    <td>
                      {v.status === "APPLIED" && (
                        <>
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => dispatch(approveVendor(v.id))}
                          >
                            Approve
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => dispatch(rejectVendor(v.id))}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {v.status === "VERIFIED" && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => dispatch(deleteVendor(v.id))}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
