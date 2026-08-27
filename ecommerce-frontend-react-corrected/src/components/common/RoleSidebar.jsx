import { NavLink } from "react-router-dom";
export default function RoleSidebar({ type }) {
  const vendor = [
      ["/vendor/dashboard", "Dashboard", "speedometer2"],
      ["/vendor/products", "Products", "box-seam"],
      ["/vendor/orders", "Orders", "receipt"],
      ["/vendor/issues", "Issues", "chat-left-text"],
      ["/vendor/profile", "Profile", "person"],
    ],
    admin = [
      ["/admin/dashboard", "Dashboard", "speedometer2"],
      ["/admin/vendors", "Vendors", "shop"],
      ["/admin/users", "Users", "people"],
      ["/admin/orders", "Orders", "receipt"],
      ["/admin/reviews", "Reviews", "star"],
      ["/admin/issues", "Issues", "chat-left-text"],
    ];
  return (
    <aside className="col-md-3 col-lg-2 bg-white border-end sidebar p-3">
      <h6 className="text-uppercase text-muted mb-3">{type} portal</h6>
      <div className="nav nav-pills flex-column gap-1">
        {(type === "vendor" ? vendor : admin).map(([to, label, icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-dark"}`
            }
          >
            <i className={`bi bi-${icon} me-2`} />
            {label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
