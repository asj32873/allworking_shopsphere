import { useDispatch, useSelector } from "react-redux";

import PortalLayout from "../../components/common/PortalLayout";

import { updateUserStatus } from "../../store/slices/userSlice";

const roleLabels = {
  USER: "User",
  VENDOR: "Vendor",
  ADMIN: "Admin",
};

const statusLabels = {
  ACTIVE: "Active",
  DISABLED: "Disabled",
};

export default function AdminUsers() {
  const dispatch = useDispatch();

  const users = useSelector((state) => state.users.items);

  const currentUser = useSelector((state) => state.auth.user);

  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;

  const disabledUsers = users.filter(
    (u) => u.status === "DISABLED",
  ).length;

  return (
    <PortalLayout type="admin">
      <div className="admin-users-page">
        <header className="admin-users-header">
          <div>
            <div className="admin-users-eyebrow">
              USER MANAGEMENT
            </div>

            <h1 className="admin-users-title">
              User Management
            </h1>

            <p className="admin-users-subtitle">
              Review platform accounts and manage user access status.
            </p>
          </div>

          <div className="admin-users-summary">
            <div className="admin-users-summary-item">
              <span className="admin-users-summary-value">
                {users.length}
              </span>

              <span className="admin-users-summary-label">
                Total Users
              </span>
            </div>

            <div className="admin-users-summary-divider" />

            <div className="admin-users-summary-item">
              <span className="admin-users-summary-value admin-users-active-value">
                {activeUsers}
              </span>

              <span className="admin-users-summary-label">
                Active
              </span>
            </div>
          </div>
        </header>

        <section className="admin-users-card">
          <div className="admin-users-card-header">
            <div>
              <div className="admin-users-card-eyebrow">
                PLATFORM ACCOUNTS
              </div>

              <h2 className="admin-users-card-title">
                All Users
              </h2>
            </div>

            <div className="admin-users-count">
              {users.length}{" "}
              {users.length === 1 ? "user" : "users"}
            </div>
          </div>

          {users.length > 0 ? (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => {
                    const isCurrentUser =
                      String(u.id) === String(currentUser?.id);

                    const isAdmin = u.role === "ADMIN";

                    const canManage = !isAdmin && !isCurrentUser;

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="admin-user-identity">
                            <div className="admin-user-avatar">
                              {(u.name || u.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <div className="admin-user-name">
                                {u.name || "Unnamed User"}
                              </div>

                              <div className="admin-user-id">
                                User #{u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="admin-user-email">
                            <i className="bi bi-envelope" />
                            {u.email}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`admin-user-role admin-user-role-${String(
                              u.role,
                            ).toLowerCase()}`}
                          >
                            <i
                              className={`bi ${
                                u.role === "ADMIN"
                                  ? "bi-shield-check"
                                  : u.role === "VENDOR"
                                    ? "bi-shop"
                                    : "bi-person"
                              }`}
                            />
                            {roleLabels[u.role] || u.role}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-user-status admin-user-status-${String(
                              u.status,
                            ).toLowerCase()}`}
                          >
                            <span className="admin-user-status-dot" />
                            {statusLabels[u.status] || u.status}
                          </span>
                        </td>

                        <td>
                          {canManage ? (
                            <button
                              className={`admin-user-toggle ${
                                u.status === "ACTIVE"
                                  ? "admin-user-disable"
                                  : "admin-user-enable"
                              }`}
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
                              <i
                                className={`bi ${
                                  u.status === "ACTIVE"
                                    ? "bi-person-slash"
                                    : "bi-person-check"
                                }`}
                              />

                              {u.status === "ACTIVE"
                                ? "Disable"
                                : "Enable"}
                            </button>
                          ) : (
                            <span className="admin-user-no-action">
                              {isCurrentUser
                                ? "Current account"
                                : "Protected account"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-users-empty">
              <div className="admin-users-empty-icon">
                <i className="bi bi-people" />
              </div>

              <div className="admin-users-empty-eyebrow">
                NO USERS
              </div>

              <h3>No user accounts</h3>

              <p>
                Registered platform users will appear here.
              </p>
            </div>
          )}
        </section>

        {disabledUsers > 0 && (
          <div className="admin-users-note">
            <i className="bi bi-info-circle" />

            <span>
              {disabledUsers}{" "}
              {disabledUsers === 1 ? "account is" : "accounts are"} currently
              disabled.
            </span>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}