import { useApp } from "../../context/AppContext";
import PortalLayout from "../../components/common/PortalLayout";

export default function AdminUsers() {
  const { users, updateUserStatus, user } = useApp();

  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>User Management</h2>

        <div className="card">
          <div className="card-body table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>
                      {u.role !== "ADMIN" &&
                        String(u.id) !== String(user.id) && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              updateUserStatus(
                                u.id,
                                u.status === "ACTIVE"
                                  ? "DISABLED"
                                  : "ACTIVE"
                              )
                            }
                          >
                            {u.status === "ACTIVE"
                              ? "Disable"
                              : "Enable"}
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
