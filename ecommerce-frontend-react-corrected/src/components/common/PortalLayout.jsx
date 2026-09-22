import RoleSidebar from "./RoleSidebar";

export default function PortalLayout({ type, children }) {
  return (
    <div className={`portal-layout portal-layout-${type}`}>
      <RoleSidebar type={type} />

      <main className="portal-content">
        <div className="portal-content-inner">{children}</div>
      </main>
    </div>
  );
}