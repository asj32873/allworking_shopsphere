import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { updateUserStatus } from "../../store/slices/userSlice";

export default function AdminUsers() {
  const dispatch = useDispatch();

  const users = useSelector((state) => state.users.items);

  const currentUser = useSelector((state) => state.auth.user);

  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>User Management</h2>

        <div className="card">
          <div className="card-body table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>

                    <td>
                      {u.role !== "ADMIN" &&
                        String(u.id) !== String(currentUser?.id) && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              dispatch(
                                updateUserStatus({
                                  id: u.id,
                                  status:
                                    u.status === "ACTIVE"
                                      ? "DISABLED"
                                      : "ACTIVE",
                                }),
                              )
                            }
                          >
                            {u.status === "ACTIVE" ? "Disable" : "Enable"}
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
