import { NavLink } from "react-router-dom";

export default function RoleSidebar({ type }) {
  const vendor = [
    ["/vendor/dashboard", "Dashboard", "speedometer2"],
    ["/vendor/products", "Products", "box-seam"],
    ["/vendor/orders", "Orders", "receipt"],
    ["/vendor/issues", "Issues", "chat-left-text"],
    ["/vendor/profile", "Profile", "person"],
  ];

  const admin = [
    ["/admin/dashboard", "Dashboard", "speedometer2"],
    ["/admin/vendors", "Vendors", "shop"],
    ["/admin/users", "Users", "people"],
    ["/admin/orders", "Orders", "receipt"],
    ["/admin/reviews", "Reviews", "star"],
    ["/admin/issues", "Issues", "chat-left-text"],
  ];

  const links = type === "vendor" ? vendor : admin;

  return (
    <aside className={`role-sidebar role-sidebar-${type}`}>
      <div className="role-sidebar-header">
        <div className="role-sidebar-brand">
          <div className="role-sidebar-brand-icon">
            <i className="bi bi-grid-1x2-fill" />
          </div>

          <div>
            <div className="role-sidebar-brand-name">
              ShopSphere
            </div>

            <div className="role-sidebar-brand-role">
              {type} portal
            </div>
          </div>
        </div>
      </div>

      <div className="role-sidebar-section">
        <div className="role-sidebar-section-label">
          Navigation
        </div>

        <nav className="role-sidebar-nav">
          {links.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `role-sidebar-link ${
                  isActive ? "role-sidebar-link-active" : ""
                }`
              }
            >
              <span className="role-sidebar-link-icon">
                <i className={`bi bi-${icon}`} />
              </span>

              <span className="role-sidebar-link-label">
                {label}
              </span>

              <i className="bi bi-chevron-right role-sidebar-link-arrow" />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="role-sidebar-footer">
        <div className="role-sidebar-footer-icon">
          <i className="bi bi-shield-check" />
        </div>

        <div>
          <div className="role-sidebar-footer-title">
            Secure workspace
          </div>

          <div className="role-sidebar-footer-text">
            ShopSphere {type} portal
          </div>
        </div>
      </div>
    </aside>
  );
}